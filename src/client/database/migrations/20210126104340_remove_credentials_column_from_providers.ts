import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema.withSchema(schema).alterTable(Table.PROVIDERS, (table) => {
    table.dropColumn('credentials');
  });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema.withSchema(schema).alterTable(Table.PROVIDERS, (table) => {
    table.json('credentials').notNullable();
  });
}
