import * as Knex from 'knex';
import logger from '../../../core/utils/logger';
import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

export function up(knex: Knex): Promise<any> {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return schemaUp(knex, knex.client.config.userParams.schemaName).catch(
    (err) => {
      logger.debug('Error', err);
    }
  );
}

export function down(knex: Knex): Knex.SchemaBuilder {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return knex.schema
    .withSchema(knex.client.config.userParams.schemaName)
    .dropTable(Table.USER_SENDER_RECEIVER_ASSOCIATION);
}

function schemaUp(knex: Knex, schema: string) {
  return knex.schema
    .withSchema(schema)
    .createTable(Table.USER_SENDER_RECEIVER_ASSOCIATION, (table) => {
      table.increments('id').primary();
      table.string('header_type').index();
      table.text('computed_hash').unique();
      table.dateTime('message_datetime');
      table.string('sender_receiver_user_type');
      table.string('sender_receiver_user_email').index();
      table.string('sender_receiver_client_domain');
      table.integer('sender_receiver_user_id');
      table.integer('client_domain_id');
      table.integer('provider_user_thread_id');
      table.integer('message_part_id');
      table.integer('thread_message_id');
      table.text('sp_message_id');
      table.text('sp_message_part_id');
      table.text('sp_provider_user_thread_id');
      table.timestamps(true, true);
      table.index('id');
    });
}
