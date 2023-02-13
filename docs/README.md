# Recovvo - SAAS WEB API - Setup and Quickstart

## Requirements

Using `docker-compose` and `make` for the local development is recommended.
Check out the links below for the setup instructions.

- [Make (google search results)](https://www.google.com/search?q=how%20to%20install%20make)
  *(Usually just running `sudo apt install make` is enough.)*
- [Docker](https://docs.docker.com/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

> *If you want to work without the Docker, you will need nodejs, npm and yarn
>  setup. Refer to the files `Makefile` and `package.json` for the commands.*

## Getting Started

Clone the repository.

```bash
$ git clone git@github.com:recovvo/saas-web-api.git
$ cd saas-web-api
```

Setup the environment variables.

```bash
$ cp .env.example .env
```

Update the `.env` file as required. Pay special attention to the missing fields.

Set up the app. The following command does a lot of things behind the scenes. If
you think you messed up, just run the command again. Docker magic!

``` bash
$ make dco/refresh
```

The app should be up and running in the `HOST` and the `PORT` defined in your
`.env` file. By default, it runs at
[`http://localhost:8000`](http://localhost:8000).

If you need to do things manually, here are the things that `make dco/refresh`
does.

```bash
# Shutdown and remove any running docker containers
$ make dco/down

# Build the docker images
$ make dco/build

# Run a few essential docker compose services
$ make dco/up

# Run the migrations for the common database
$ make dco/migrate-common

# Run migrations for the tenant database, create a new tenant,
# and email the invite link
$ make dco/setup-tenant
```

In addition to the commands above, you might want commands for rolling back the
migrations.

```bash
# To rollback the last batch of migrations in the common db
$ make dco/rollback-common

# To rollback the last batch of migrations in the tenant db
$ make dco/rollback-tenant
```

## Generating Migrations and Seeds

### For Common DB

Example,

```bash
# Create a migration named `create_posts_table`
$ make dco/make-migration-common NAME=create_posts_table

# If seeder is needed, create a corresponding seeder `posts_table_seeder`
$ make dco/make-seeder-common NAME=posts_table_seeder
```

Modify migration and seeder file as per the requirement. Be sure to use the
seeder from within the migration. Then finally,

```bash
# Run migrations for common db
$ make dco/migrate-common

# To rollback
$ make dco/rollback-common
```

### For Tenant DB

Example,

```bash
# Create a migration named `create_posts_table`
$ make dco/make-migration-tenant NAME=create_posts_table

# If seeder is needed, create a corresponding seeder `posts_table_seeder`
$ make dco/make-seeder-tenant NAME=posts_table_seeder
```

Modify migration and seeder file as per the requirement. Be sure to call the
seeder from within the migration. Then finally,

```bash
# Run migrations for tenant db
$ make dco/migrate-tenant

# To rollback
$ make dco/rollback-tenant
```
