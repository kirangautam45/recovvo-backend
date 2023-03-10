# STAGE: Development
FROM node:14-alpine3.13 AS dev
RUN apk update && apk add bash && apk add make && apk add python3
EXPOSE 8000

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install

COPY . /app/
CMD ["yarn", "local"]


# STAGE: Migrate common
FROM dev AS migrate-common

ARG DB_CLIENT
ARG DB_HOST
ARG DB_PORT
ARG DB_USER
ARG DB_PASSWORD
ARG COMMON_DB_NAME
ARG LOCAL_DB_NAME

ENV DB_CLIENT $DB_CLIENT
ENV DB_HOST $DB_HOST
ENV DB_PORT $DB_PORT
ENV DB_USER $DB_USER
ENV DB_PASSWORD $DB_PASSWORD
ENV COMMON_DB_NAME $COMMON_DB_NAME
ENV LOCAL_DB_NAME $LOCAL_DB_NAME

WORKDIR /app
CMD make migrate-common


# STAGE: Rollback common
FROM dev AS rollback-common

ARG DB_CLIENT
ARG DB_HOST
ARG DB_PORT
ARG DB_USER
ARG DB_PASSWORD
ARG COMMON_DB_NAME
ARG LOCAL_DB_NAME

ENV DB_CLIENT $DB_CLIENT
ENV DB_HOST $DB_HOST
ENV DB_PORT $DB_PORT
ENV DB_USER $DB_USER
ENV DB_PASSWORD $DB_PASSWORD
ENV COMMON_DB_NAME $COMMON_DB_NAME
ENV LOCAL_DB_NAME $LOCAL_DB_NAME

WORKDIR /app
CMD make rollback-common


# STAGE: Setup a new tenant
FROM dev AS setup-tenant

ARG DB_CLIENT
ARG DB_HOST
ARG DB_PORT
ARG DB_USER
ARG DB_PASSWORD
ARG COMMON_DB_NAME
ARG LOCAL_DB_NAME

ENV DB_CLIENT $DB_CLIENT
ENV DB_HOST $DB_HOST
ENV DB_PORT $DB_PORT
ENV DB_USER $DB_USER
ENV DB_PASSWORD $DB_PASSWORD
ENV COMMON_DB_NAME $COMMON_DB_NAME
ENV LOCAL_DB_NAME $LOCAL_DB_NAME

ARG REDIRECTION_URL
ARG SENDER_EMAIL
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_REGION
ARG INVITATION_EMAIL_DURATION
ARG INVITATION_EMAIL_SECRET_KEY

ENV REDIRECTION_URL $REDIRECTION_URL
ENV SENDER_EMAIL $SENDER_EMAIL
ENV AWS_ACCESS_KEY_ID $AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY $AWS_SECRET_ACCESS_KEY
ENV AWS_REGION $AWS_REGION
ENV INVITATION_EMAIL_DURATION $INVITATION_EMAIL_DURATION
ENV INVITATION_EMAIL_SECRET_KEY $INVITATION_EMAIL_SECRET_KEY

ARG DATA_SCHEMA_NAME
ARG DATA_ORGANIZATION_NAME
ARG DATA_ORGANIZATION_URL
ARG DATA_ADMIN_FIRSTNAME
ARG DATA_ADMIN_LASTNAME
ARG DATA_ADMIN_EMAIL

ENV DATA_SCHEMA_NAME $DATA_SCHEMA_NAME
ENV DATA_ORGANIZATION_NAME $DATA_ORGANIZATION_NAME
ENV DATA_ORGANIZATION_URL $DATA_ORGANIZATION_URL
ENV DATA_ADMIN_FIRSTNAME $DATA_ADMIN_FIRSTNAME
ENV DATA_ADMIN_LASTNAME $DATA_ADMIN_LASTNAME
ENV DATA_ADMIN_EMAIL $DATA_ADMIN_EMAIL

WORKDIR /app
CMD make setup-tenant \
  SCHEMA_NAME="$DATA_SCHEMA_NAME" \
  ORGANIZATION_NAME="$DATA_ORGANIZATION_NAME" \
  ORGANIZATION_URL="$DATA_ORGANIZATION_URL" \
  ADMIN_FIRSTNAME="$DATA_ADMIN_FIRSTNAME" \
  ADMIN_LASTNAME="$DATA_ADMIN_LASTNAME" \
  ADMIN_EMAIL="$DATA_ADMIN_EMAIL" 


# STAGE: Migrate tenant
FROM dev AS migrate-tenant

ARG DB_CLIENT
ARG DB_HOST
ARG DB_PORT
ARG DB_USER
ARG DB_PASSWORD
ARG COMMON_DB_NAME
ARG LOCAL_DB_NAME
ARG DATA_SCHEMA_NAME

ENV DB_CLIENT $DB_CLIENT
ENV DB_HOST $DB_HOST
ENV DB_PORT $DB_PORT
ENV DB_USER $DB_USER
ENV DB_PASSWORD $DB_PASSWORD
ENV COMMON_DB_NAME $COMMON_DB_NAME
ENV LOCAL_DB_NAME $LOCAL_DB_NAME
ENV DATA_SCHEMA_NAME $DATA_SCHEMA_NAME

WORKDIR /app
CMD make migrate-tenant SCHEMA_NAME="$DATA_SCHEMA_NAME"


# STAGE: Rollback tenant
FROM dev AS rollback-tenant

ARG DB_CLIENT
ARG DB_HOST
ARG DB_PORT
ARG DB_USER
ARG DB_PASSWORD
ARG COMMON_DB_NAME
ARG LOCAL_DB_NAME
ARG DATA_SCHEMA_NAME

ENV DB_CLIENT $DB_CLIENT
ENV DB_HOST $DB_HOST
ENV DB_PORT $DB_PORT
ENV DB_USER $DB_USER
ENV DB_PASSWORD $DB_PASSWORD
ENV COMMON_DB_NAME $COMMON_DB_NAME
ENV LOCAL_DB_NAME $LOCAL_DB_NAME
ENV DATA_SCHEMA_NAME $DATA_SCHEMA_NAME

WORKDIR /app
CMD make rollback-tenant SCHEMA_NAME="$DATA_SCHEMA_NAME"


# # STAGE: Run migrations
# FROM dev AS migrate
# WORKDIR /app
# COPY --from=dev /app /app

# ENV SCHEMA_NAME 'lftechnology'
# EXPOSE 8000

# CMD ["yarn", "tenant:setup", "$SCHEMA_NAME"]


# STAGE: Rollback migrations
# FROM dev AS migrate-rollback-client
# WORKDIR /app
# COPY --from=dev /app /app

# ENV SCHEMA_NAME 'lftechnology'
# CMD ["yarn", "tenant:rollback-table-local", "$SCHEMA_NAME"]


# STATE: Rollback admin migrations
# FROM dev AS migrate-rollback-admin
# WORKDIR /app
# COPY --from=dev /app /app
# CMD yarn rollback-admin


# STAGE: Builder
FROM node:14-alpine3.13 AS builder
WORKDIR /app
COPY --from=dev /app /app
RUN yarn build


# STAGE: Prod Dependencies Builder
FROM node:14-alpine3.13 AS prod-dependencies
WORKDIR /app
COPY ["package.json", "yarn.lock", "./"]
RUN yarn install --prod


# STAGE: Prod Deploy Ready Image
FROM node:14-alpine3.13 AS prod
EXPOSE 8000
WORKDIR /app
COPY public /app/public
COPY --from=builder /app/dist /app/dist
COPY --from=prod-dependencies /app/node_modules /app/node_modules
CMD ["node", "dist/index.js"]
