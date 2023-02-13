import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.PROVIDER_USERS_COLLABORATORS, (table) => {
      table.renameColumn(
        'use_default_duration',
        'is_custom_access_duration_set'
      );
    })
    .alterTable(Table.PROVIDER_USERS_ALIASES, (table) => {
      table.renameColumn(
        'use_default_duration',
        'is_custom_access_duration_set'
      );
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;
  return knex.schema
    .withSchema(schema)
    .alterTable(Table.PROVIDER_USERS_COLLABORATORS, (table) => {
      table.renameColumn(
        'is_custom_access_duration_set',
        'use_default_duration'
      );
    })
    .alterTable(Table.PROVIDER_USERS_ALIASES, (table) => {
      table.renameColumn(
        'is_custom_access_duration_set',
        'use_default_duration'
      );
    });
}
