import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.MESSAGE_PARTS, (table) => {
      table.boolean('has_attachments').defaultTo(false);
      table.boolean('are_attachments_synchronized').defaultTo(false);
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.MESSAGE_PARTS, (table) => {
      table.dropColumn('has_attachments');
      table.dropColumn('are_attachments_synchronized');
    });
}
