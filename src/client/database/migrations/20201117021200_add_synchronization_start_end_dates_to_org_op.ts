import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.ORGANIZATION_OPERATION, (table) => {
      table.dateTime('last_synchronization_started_at');
      table.dateTime('last_synchronization_ended_at');
      table.integer('latest_sync_count').defaultTo(0);
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.ORGANIZATION_OPERATION, (table) => {
      table.dropColumn('last_synchronization_started_at');
      table.dropColumn('last_synchronization_ended_at');
      table.dropColumn('latest_sync_count');
    });
}
