#!/bin/bash

migrate() {
    yarn migrate-client
}

seedClient() {
    SCHEMA_NAME=$schema_name yarn seed-client
}

rollbackMigration() {
    SCHEMA_NAME=$schema_name yarn rollback-client
}

setupTenant() {
    yarn tenant:create-admin "$schema_name" && yarn tenant:create-schema-local "$schema_name" && yarn tenant:migrate-table-local "$schema_name" "$organization_name" "$organization_url" "$admin_firstname" "$admin_lastname" "$admin_email"
}

setupClient() {
    yarn tenant:create-schema-local "$schema_name" && yarn tenant:migrate-table-local "$schema_name"
}

set -e

schema_name=$2

if [ -z "$schema_name" ]; then
    echo "Please provide schema name"
    exit 1
elif [ "$1" = "migrate" ]; then #Table migration into local DB in schema.
    organization_name=$3
    organization_url=$4
    admin_firstname=$5
    admin_lastname=$6
    admin_email=$7

    migrate

elif [ "$1" = "rollback-migrate" ]; then #Rollback table migration from local DB.
    rollbackMigration "$schema_name"

elif [ "$1" = "setup" ]; then #Setup client or tenant from scratch.
    organization_name=$3
    organization_url=$4
    admin_firstname=$5
    admin_lastname=$6
    admin_email=$7

    if [ -z "$organization_name" ]; then
        echo "Please provide organization name"
        exit 1
    fi

    if [ -z "$organization_url" ]; then
        echo "Please provide organization url"
        exit 1
    fi

    if [ -z "$admin_firstname" ]; then
        echo "Please provide admin firstname"
        exit 1
    fi

    if [ -z "$admin_lastname" ]; then
        echo "Please provide admin lastname"
        exit 1
    fi

    if [ -z "$admin_email" ]; then
        echo "Please provide admin email"
        exit 1
    fi

    setupTenant

elif [ "$1" = "seed-client" ]; then #Seed data into local DB.
    seedClient "$schema_name"
elif [ "$1" = "setup-client" ]; then #Setup client or tenant skipping tenant addition in admin DB.
    setupClient "$schema_name"
else
    echo "Command not found"
fi
