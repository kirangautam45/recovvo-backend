import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema.withSchema(schema).alterTable(Table.PROVIDERS, (table) => {
    table.boolean('is_tenant_id_recieved').defaultTo(false);
  });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema.withSchema(schema).alterTable(Table.PROVIDERS, (table) => {
    table.dropColumn('is_tenant_id_recieved');
  });
}
