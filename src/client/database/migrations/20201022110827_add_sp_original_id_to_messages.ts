import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.THREAD_MESSAGES, (table) => {
      table.string('sp_original_message_id');
    })
    .alterTable(Table.MESSAGE_PARTS, (table) => {
      table.string('sp_original_message_id');
    })
    .alterTable(Table.USER_SENDER_RECEIVER_ASSOCIATION, (table) => {
      table.string('sp_original_message_id');
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;
  return knex.schema
    .withSchema(schema)
    .alterTable(Table.THREAD_MESSAGES, (table) => {
      table.dropColumn('sp_original_message_id');
    })
    .alterTable(Table.MESSAGE_PARTS, (table) => {
      table.dropColumn('sp_original_message_id');
    })
    .alterTable(Table.USER_SENDER_RECEIVER_ASSOCIATION, (table) => {
      table.dropColumn('sp_original_message_id');
    });
}
