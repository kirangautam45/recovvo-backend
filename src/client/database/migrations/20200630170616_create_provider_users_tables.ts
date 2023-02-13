import * as Knex from 'knex';

import logger from '../../../core/utils/logger';
import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

import { seed } from '../seeds/02_provider_user_table_seeder';

export function up(knex: Knex): Promise<any> {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return schemaUp(knex, knex.client.config.userParams.schemaName)
    .then(() => seed(knex))
    .catch((err) => {
      logger.debug('Error', err);
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return knex.schema
    .withSchema(knex.client.config.userParams.schemaName)
    .dropTable(Table.PROVIDER_USERS_SUPERVISORS)
    .dropTable(Table.PROVIDER_USERS);
}

function schemaUp(knex: Knex, schema: string) {
  return knex.schema
    .withSchema(schema)
    .createTable(Table.PROVIDER_USERS, (table) => {
      table.increments('id').primary().unsigned().index();
      table.string('email').notNullable().unique().index();
      table.boolean('is_suppressed').defaultTo(false);
      table.boolean('is_app_user').defaultTo(false);
      table.boolean('is_verified').defaultTo(false);
      table.boolean('is_active').defaultTo(false); // false if organization admin deactivates the user
      table.boolean('has_signed_up').defaultTo(false); // true after the user accepts the invitation
      table.boolean('is_supervisor').defaultTo(false);
      table.boolean('is_admin').defaultTo(false);
      table.string('sp_user_id');
      table.text('position');
      table
        .integer('organization_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(`${schema}.${Table.ORGANIZATION}`)
        .onDelete('CASCADE');
      table
        .integer('provider_id')
        .unsigned()
        .references('id')
        .inTable(`${schema}.${Table.PROVIDERS}`)
        .onDelete('CASCADE');
      table.specificType('alternate_provider_ids', 'INT[]');
      table.string('first_name');
      table.string('last_name');
      table.string('middle_name');
      table.text('phone_numbers');
      table
        .integer('department_id')
        .unsigned()
        .references('id')
        .inTable(`${schema}.${Table.DEPARTMENTS}`);
      table.string('invitation_link');
      table.timestamp('last_login_date');
      table.boolean('is_deleted').defaultTo(false); // true if deleted by the organization admin
      table
        .integer('invited_by_id')
        .unsigned()
        .references('id')
        .inTable(`${schema}.${Table.PROVIDER_USERS}`);
      table.timestamps(true, true);
    })
    .then(() =>
      knex.schema
        .withSchema(schema)
        .createTable(
          Table.PROVIDER_USERS_SUPERVISORS,
          (providerUserSupervisorTable) => {
            providerUserSupervisorTable.increments('id').primary();
            providerUserSupervisorTable.boolean('is_deleted').defaultTo(false);
            providerUserSupervisorTable
              .integer('supervisor_id')
              .unsigned()
              .notNullable()
              .references('id')
              .inTable(`${schema}.${Table.PROVIDER_USERS}`)
              .onDelete('CASCADE');
            providerUserSupervisorTable
              .integer('user_id')
              .unsigned()
              .notNullable()
              .references('id')
              .inTable(`${schema}.${Table.PROVIDER_USERS}`)
              .onDelete('CASCADE');
            providerUserSupervisorTable.timestamps(true, true);
          }
        )
    );
}
