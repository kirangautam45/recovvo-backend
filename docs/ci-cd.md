# CI/CD Setup of saas-web-api

There are various steps involved while setting up an environment from scratch.
The pipelines can be found [here](https://app.buddy.works/recovvo-ci/saas-web-api/pipelines).

The above link takes you to a page which looks like this:
![Image of pipeline homepage](https://recovvo-documentation-assets.s3.us-east-2.amazonaws.com/saas-web-api-ci-cd/Screenshot_2020-11-27+Pipelines+%C2%B7+saas-web-api.png)

By looking at the image above, you can observe that we have a naming convention
as follows: `[ENVIRONMENT] - [Step-no] - Action Name`. Let's understand what
each of the steps do in details.

## Steps

There are several steps. Just running one after another usually does the trick.
Make absolutely sure to update all the environment variables in each of the
pipeline before running any of them though. The setup is all configured via the
environment variables.

### Step 1. Create Database

The first step is to create databases; `db_common` for the common database and
`db_tenant` for the tenant specific data.

### Step 2. Migrate Common Database

The next step is to run all the migrations specific to the database `db_common`.
Also, note that if migrations specific to `db_common` are created in the future,
this pipeline needs to be ran again.

### Step 3. Setup Tenant

The next step is very important, as this is the step that needs to be run for each
new tenant. This step creates the tenant account, does necessary initialization
and database seeding, and finally sends email invite for the new tenant.

Note that the main action is performed in a docker target build. But before that,
the image is built first, and then pushed to the custom images repository in the
AWS called Amazon ECR.

### Step 4. Build, Test, Deploy

The next step is to actually build the app. And then run the tests, build a
Docker image for the app to run in the Kubernetes, tag it and push it, and then
finally deploy it to Amazon EKS where the app is deployed in the Kubernetes engine.

### Bonus Step. Migrate Tenant Database

The `db_tenant` database is up to date when setting up the tenant itself. But,
say in future, if new migration are written for the `db_tenant`, this action
needs to be run.

## Creating New

If we need to create a new environment (say UAT, or Staging), or we might simply
want to onboard a new Tenant, we need to make a copy of all the required
pipelines. Make sure to follow the naming conventions to avoid confusion, and
double check each environment variables before you run any of the pipelines or
the actions inside them.
