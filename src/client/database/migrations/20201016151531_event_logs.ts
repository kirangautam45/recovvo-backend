import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

export function up(knex: Knex): Knex.SchemaBuilder {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return knex.schema
    .withSchema(knex.client.config.userParams.schemaName)
    .createTable(Table.EVENT_LOGS, (table) => {
      table.increments('id').primary();
      table.string('event_name').notNullable();
      table.jsonb('event_properties');
      table.jsonb('user_properties');
      table.integer('logged_by');
      table.timestamps(true, true);
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return knex.schema
    .withSchema(knex.client.config.userParams.schemaName)
    .dropTable(Table.EVENT_LOGS);
}
