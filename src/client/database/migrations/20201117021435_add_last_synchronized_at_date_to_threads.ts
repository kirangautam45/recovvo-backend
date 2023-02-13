import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.PROVIDER_USER_THREADS, (table) => {
      table.dateTime('last_synchronization_at');
      table.boolean('is_synchronized').defaultTo(false);
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.PROVIDER_USER_THREADS, (table) => {
      table.dropColumn('last_synchronization_at');
      table.dropColumn('is_synchronized');
    });
}
