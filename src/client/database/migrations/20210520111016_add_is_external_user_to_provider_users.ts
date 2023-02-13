import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.PROVIDER_USERS, (table) => {
      table.boolean('is_external_user').defaultTo(false);
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.MESSAGE_PARTS, (table) => {
      table.dropColumn('is_external_user');
    });
}
