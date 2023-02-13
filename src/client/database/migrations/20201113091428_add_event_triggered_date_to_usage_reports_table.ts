import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.USAGE_REPORT, (table) => {
      table.date('event_triggered_date');
    })
    .alterTable(Table.USAGE_REPORT, (table) => {
      table.dropUnique(['logged_by']);
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.USAGE_REPORT, (table) => {
      table.date('event_triggered_date');
    })
    .alterTable(Table.USAGE_REPORT, (table) => {
      table.dropUnique(['logged_by']);
    });
}
