import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.USAGE_REPORT, (table) => {
      table.integer('emails_reviewed').defaultTo(0); //add
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.USAGE_REPORT, (table) => {
      table.dropColumn('emails_reviewed');
    });
}
