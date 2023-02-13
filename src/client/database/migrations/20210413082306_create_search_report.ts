import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

export function up(knex: Knex): Knex.SchemaBuilder {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .createTable(Table.SEARCH_REPORT, (table) => {
      table.increments('id').primary();
      table.integer('logged_by').unsigned().notNullable();
      table.string('primary_search').defaultTo('-');
      table.string('secondary_search').defaultTo('-');
      table.string('searched').defaultTo('-');

      table.timestamps(true, true);
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  return knex.schema.dropTable(Table.SEARCH_REPORT);
}
