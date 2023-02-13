.PHONY: help prepare-dev test lint run
.DEFAULT_GOAL := help

# Load all the environment variables from .env
export $(cat .env | xargs)

define BROWSER_PYSCRIPT
import webbrowser, sys

webbrowser.open(sys.argv[1])
endef
export BROWSER_PYSCRIPT

BROWSER := python3 -c "$$BROWSER_PYSCRIPT"

DCO ?=  docker-compose
DCO_RUN ?= $(DCO) run --rm
DCO_RUN_U ?= $(DCO_RUN) -u 1000
DCO_RUN_API_MAKE ?= $(DCO_RUN) api make

define PRINT_HELP_PYSCRIPT
import re, sys

for line in sys.stdin:
	match = re.match(r'^([/a-zA-Z_-]+):.*?## (.*)$$', line)
	if match:
		target, help = match.groups()
		print("%-30s %s" % (target, help))
endef
export PRINT_HELP_PYSCRIPT

APP_ROOT ?= $(shell 'pwd')
export ENVIRONMENT_OVERRIDE_PATH ?= $(APP_ROOT)/env/Makefile.override
export OVERLAY_PATH ?= k8s/overlays/$(STAGE)/
export DOCKER_BUILD_FLAGS ?= --no-cache
export DOCKER_BUILD_PATH ?= $(APP_ROOT)
export DOCKER_FILE ?= $(APP_ROOT)/Dockerfile
export SOURCE_IMAGE ?= saas-web-api
export TARGET_IMAGE ?= $(REGISTRY_URL)/$(ECR_REPO_NAME)
export TARGET_IMAGE_LATEST ?= $(TARGET_IMAGE):$(BUDDY_PROJECT_NAME)-$(BUDDY_EXECUTION_BRANCH)-$(BUDDY_EXECUTION_REVISION_SHORT)

-include $(ENVIRONMENT_OVERRIDE_PATH)

define kustomize-image-edit
	cd $(OVERLAY_PATH) && kustomize edit set image saas-web-api=$(1) && cd $(APP_ROOT)
endef


IMAGE_NAME ?= recovvo/runtime-deps-image

# Alias command for docker's `make` executable
DOCKER_RUN ?=  \
		docker run \
		--rm \
		-v $(APP_ROOT):/app \
		-w /app \
		--entrypoint=make \
		--env EKS_CLUSTER_NAME=$(EKS_CLUSTER_NAME) \
		--env AWS_REGION=$(AWS_REGION) \
		--env AWS_ACCESS_KEY_ID=$(AWS_ACCESS_KEY_ID) \
		--env AWS_SECRET_ACCESS_KEY=$(AWS_SECRET_ACCESS_KEY) \
		$(IMAGE_NAME)


docker-build: ## build docker file
	@docker build $(DOCKER_BUILD_FLAGS) --target dev -t $(SOURCE_IMAGE) -f $(DOCKER_FILE) $(DOCKER_BUILD_PATH)

docker-tag: ## docker tag
	@docker tag $(SOURCE_IMAGE) $(TARGET_IMAGE_LATEST)

docker-push: ## docker push
	@docker push $(TARGET_IMAGE_LATEST)

ecr-docker-login: ## Login to ECR registry
	@eval `aws ecr get-login --no-include-email --region $(AWS_REGION)`

docker/update-kubeconfig: ## Update docker kube config
	@$(DOCKER_RUN) update-kubeconfig

update-kubeconfig: ## Update kube config
	@aws eks update-kubeconfig --name=$(EKS_CLUSTER_NAME) --region=$(AWS_REGION)

create-bucket: ## Create-bucket
	if [ $(S3_BUCKET_REGION) = us-east-1 ];then aws s3api create-bucket --bucket $(S3_BUCKET_NAME) --region $(S3_BUCKET_REGION); else aws s3api create-bucket --bucket $(S3_BUCKET_NAME) --region $(S3_BUCKET_REGION) --create-bucket-configuration LocationConstraint=$(S3_BUCKET_REGION); fi
	@aws s3api put-bucket-cors --bucket $(S3_BUCKET_NAME) --cors-configuration file://s3CorsConfig.json


edit-image-name: ## edit image name in kustomize
	@$(call kustomize-image-edit,$(TARGET_IMAGE_LATEST))

docker/eks-deploy: ## Deploy in EKS cluster using docker
	@$(DOCKER_RUN) kustomize build  $(OVERLAY_PATH) | kubectl apply -f -

eks-deploy: ## Deploy in EKS cluster
	@kustomize build  $(OVERLAY_PATH) | kubectl apply -f -

clean: ## Remove log file.
	@rm -rf logs/**.log logs/**.json build

dco/logs/api: ## Docker compose - Follow the logs for api service
	@$(DCO) logs -f --tail 100 api

dco/up: ## Docker compose - Bring the stack up
	@$(DCO) up -d postgres api pgadmin

dco/down: ## Docker compose - Bring the stack down
	@$(DCO) down

dco/stop: ## Docker compose - Stop the stack without removing containers
	@$(DCO) stop

dco/build: ## Docker compose build
	@$(DCO) build

install: ## installs the app dependencies
	@yarn install

dco/install: ## Docker compose - Install the app dependencies
	@$(DCO_RUN_API_MAKE) install

migrate-common: ## Run the migration for common db
	@yarn migrate-admin

dco/migrate-common: ## Docker compose - Run the migration for common db
	@$(DCO_RUN) migrate-common

rollback-common: ## Run the rollback for common db
	@yarn rollback-admin

dco/rollback-common: ## Docker compose - Run the rollback for common db
	@$(DCO_RUN) rollback-common

create-tenant: ## Create schema and run migration for a new tenant
	@yarn tenant:setup \
		"$(SCHEMA_NAME)" \
		"$(ORGANIZATION_NAME)" \
		"$(ORGANIZATION_URL)" \
		"$(ADMIN_FIRSTNAME)" \
		"$(ADMIN_LASTNAME)" \
		"$(ADMIN_EMAIL)" 

dco/create-tenant: ## Docker compose - Create schema and run migration for a new tenant
	@$(DCO_RUN_API_MAKE) create-tenant \
		SCHEMA_NAME="$(SCHEMA_NAME)" \
		ORGANIZATION_NAME="$(ORGANIZATION_NAME)" \
		ORGANIZATION_URL="$(ORGANIZATION_URL)" \
		ADMIN_FIRSTNAME="$(ADMIN_FIRSTNAME)" \
		ADMIN_LASTNAME="$(ADMIN_LASTNAME)" \
		ADMIN_EMAIL="$(ADMIN_EMAIL)" 

move-credential:
	@yarn tenant:move-credential "$(SCHEMA_NAME)" "$(SERVICE_TYPE)"

encode-subject-snippet: ## Encode subject snippet in messages
	@yarn tenant:encode-subject-snippet "$(SCHEMA_NAME)"

dco/encode-subject-snippet: ## Docker compose - Encode subject snippet in messages
	@$(DCO_RUN_API_MAKE) encode-subject-snippet \
		SCHEMA_NAME="$(SCHEMA_NAME)" 

invite-tenant: ## Send email invitation
	@yarn tenant:invite "$(SCHEMA_NAME)" "$(ADMIN_EMAIL)"

dco/invite-tenant: ## Docker compose - Send email invitation
	@$(DCO_RUN_API_MAKE) invite-tenant \
		SCHEMA_NAME="$(SCHEMA_NAME)" \
		ADMIN_EMAIL="$(ADMIN_EMAIL)"
		

setup-tenant: ## Create and invite tenant
	@make create-tenant \
		SCHEMA_NAME="$(SCHEMA_NAME)" \
		ORGANIZATION_NAME="$(ORGANIZATION_NAME)" \
		ORGANIZATION_URL="$(ORGANIZATION_URL)" \
		ADMIN_FIRSTNAME="$(ADMIN_FIRSTNAME)" \
		ADMIN_LASTNAME="$(ADMIN_LASTNAME)" \
		ADMIN_EMAIL="$(ADMIN_EMAIL)"

	@make invite-tenant \
		SCHEMA_NAME="$(SCHEMA_NAME)" \
		ADMIN_EMAIL="$(ADMIN_EMAIL)"

dco/setup-tenant: ## Docker compose - Create and invite tenant
	@$(DCO_RUN) setup-tenant

migrate-tenant: ## Run the migrations for tenant schema
	@SCHEMA_NAME="$(SCHEMA_NAME)" yarn migrate-client

dco/migrate-tenant: ## Docker compose - Run the migrations for tenant schema
	@$(DCO_RUN) migrate-tenant

rollback-tenant: ## Run the rollback for tenant schema
	@SCHEMA_NAME="$(SCHEMA_NAME)" yarn rollback-client

dco/rollback-tenant: ## Docker compose - Run the rollback for tenant schema
	@$(DCO_RUN) rollback-tenant

make-migration-common: ## Create a new migration for common db
	@yarn make:migration:common $(NAME)

dco/make-migration-common: ## Docker compose - Create a new migration for common db
	@$(DCO_RUN_U) api make make-migration-common NAME=$(NAME)

make-seeder-common: ## Create a new seeder for common db
	@yarn make:seeder:common $(NAME)

dco/make-seeder-common: ## Docker compose - Create a new seeder for common db
	@$(DCO_RUN_U) api make make-seeder-common NAME=$(NAME)

make-migration-tenant: ## Create a new migration for tenant db
	@SCHEMA_NAME=$(DATA_SCHEMA_NAME) yarn make:migration:tenant $(NAME)

dco/make-migration-tenant: ## Docker compose - Create a new migration for tenant db
	@$(DCO_RUN_U) api make make-migration-tenant NAME=$(NAME)

make-seeder-tenant: ## Create a new seeder for tenant db
	@SCHEMA_NAME=$(DATA_SCHEMA_NAME) yarn make:seeder:tenant $(NAME)

dco/make-seeder-tenant: ## Docker compose - Create a new seeder for tenant db
	@$(DCO_RUN_U) api make make-seeder-tenant NAME=$(NAME)


# TODO: Add a way to seed dummy values without creating duplicate values

# seed-client: ## Seed client database
# 	yarn tenant:seed-local $(SCHEMA_NAME)

# dco/seed-client: ## Seed client database
# 	$(DCO_RUN_API_MAKE) seed-client SCHEMA_NAME=$(SCHEMA_NAME)

seed-common: ## Seed admin database
	yarn seed-admin

dco/seed-common: ## Seed admin database
	$(DCO_RUN_API_MAKE) seed-common

# seed: ## Seed both client and admin databases
# 	make seed-admin && make seed-client

# dco/seed: ## Seed both client and admin databases
# 	$(DCO_RUN_API_MAKE) seed SCHEMA_NAME=$(SCHEMA_NAME)

dco/load-gsuite: ## Docker compose - Load gsuite data to postgres
	@$(DCO_RUN) gsuite-to-postgres

dco/refresh: ## Refresh will drop everything and start the app with new migrations
	@make dco/down
	@make dco/build
	@make dco/up
	@make dco/migrate-common
	@make dco/setup-tenant

help:
	@python3 -c "$$PRINT_HELP_PYSCRIPT" < $(MAKEFILE_LIST)
