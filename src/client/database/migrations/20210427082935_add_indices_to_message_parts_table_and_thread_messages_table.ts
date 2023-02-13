import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.THREAD_MESSAGES, (table) => {
      table.index(
        ['thread_id', 'message_datetime'],
        'thread_id_message_datetime_idx'
      );
    })
    .alterTable(Table.MESSAGE_PARTS, (table) => {
      table.index(
        ['is_attachment', 'message_id'],
        'is_attachment_message_id_idx'
      );
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.THREAD_MESSAGES, (table) => {
      table.dropIndex('thread_id_message_datetime_idx');
    })
    .alterTable(Table.MESSAGE_PARTS, (table) => {
      table.dropIndex('is_attachment_message_id_idx');
    });
}
