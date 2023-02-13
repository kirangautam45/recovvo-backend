import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;
  return knex.schema
    .withSchema(schema)
    .alterTable(Table.USER_SENDER_RECEIVER_ASSOCIATION, (table) => {
      table.index(
        ['sender_receiver_user_type', 'header_type'],
        'user_type_header_type_idx'
      );
      table.index(
        ['provider_user_thread_id', 'sender_receiver_user_type', 'header_type'],
        'thread_id_user_type_header_type_idx'
      );
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.USER_SENDER_RECEIVER_ASSOCIATION, (table) => {
      table.dropIndex('user_type_header_type_idx');
      table.dropIndex('thread_id_user_type_header_type_idx');
    });
}
