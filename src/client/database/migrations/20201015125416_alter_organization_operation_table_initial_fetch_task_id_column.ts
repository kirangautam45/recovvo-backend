import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.ORGANIZATION_OPERATION, (table) => {
      table.string('initial_fetch_task_id').alter();
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;
  return knex.schema
    .withSchema(schema)
    .alterTable(Table.ORGANIZATION_OPERATION, (table) => {
      table.integer('initial_fetch_task_id').alter();
    });
}
