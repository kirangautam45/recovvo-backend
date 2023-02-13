import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

export function up(knex: Knex): Knex.SchemaBuilder {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return knex.schema
    .withSchema(knex.client.config.userParams.schemaName)
    .createTable(Table.USAGE_REPORT, (table) => {
      table.increments('id').primary();
      table.integer('searches');
      table.timestamp('last_search');
      table.integer('contact_exports');
      table.integer('attachment_exports');
      table.integer('logged_by').unique();

      table.timestamps(true, true);
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return knex.schema
    .withSchema(knex.client.config.userParams.schemaName)
    .dropTable(Table.USAGE_REPORT);
}
