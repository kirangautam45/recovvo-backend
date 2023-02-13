import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.PROVIDER_USERS_COLLABORATORS, (table) => {
      table.json('mapping_history');
    })
    .alterTable(Table.PROVIDER_USERS_ALIASES, (table) => {
      table.json('mapping_history');
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;
  return knex.schema
    .withSchema(schema)
    .alterTable(Table.PROVIDER_USERS_COLLABORATORS, (table) => {
      table.dropColumn('mapping_history');
    })
    .alterTable(Table.PROVIDER_USERS_ALIASES, (table) => {
      table.dropColumn('mapping_history');
    });
}
