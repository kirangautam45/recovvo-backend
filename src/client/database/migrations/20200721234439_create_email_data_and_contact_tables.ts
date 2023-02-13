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
    .dropTable(Table.MESSAGE_PARTS)
    .dropTable(Table.THREAD_MESSAGES)
    .dropTable(Table.PROVIDER_USER_THREADS)
    .dropTable(Table.CLIENT_DOMAIN_CONTACTS);
}

function schemaUp(knex: Knex, schema: string) {
  return knex.schema
    .withSchema(schema)
    .createTable(Table.CLIENT_DOMAIN_CONTACTS, (table) => {
      table.increments('id').primary().index();
      table.string('first_name');
      table.string('last_name');
      table.string('position');
      table.string('contact_organization_name');
      table.string('email').notNullable().unique().index();
      table.text('work_phone_number');
      table.text('cell_phone_number');
      table.text('address');
      table.boolean('is_deleted').defaultTo(false);
      table.jsonb('emails_meta_data');
      table
        .integer('client_domain_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(`${schema}.${Table.CLIENT_DOMAINS}`);
      table.timestamps(true, true);
    })
    .then(() =>
      knex.schema
        .withSchema(schema)
        .createTable(Table.PROVIDER_USER_THREADS, (table) => {
          table.bigIncrements('id').primary().index();
          table.string('sp_thread_id').unique().notNullable();
          table.boolean('is_deleted').defaultTo(false);
          table
            .integer('provider_user_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable(`${schema}.${Table.PROVIDER_USERS}`);
          table.timestamps(true, true);
        })
    )
    .then(() =>
      knex.schema
        .withSchema(schema)
        .createTable(Table.THREAD_MESSAGES, (table) => {
          table.bigIncrements('id').primary().index();
          table.string('sp_message_id').unique();
          table.text('snippet');
          table.bigInteger('size_estimate');
          table.dateTime('message_datetime');
          table.boolean('is_auto_email');
          table.boolean('is_deleted').defaultTo(false);
          table.timestamps(true, true);
          table.string('sp_thread_id');
          table
            .integer('thread_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable(`${schema}.${Table.PROVIDER_USER_THREADS}`);
        })
    )
    .then(() =>
      knex.schema
        .withSchema(schema)
        .createTable(Table.MESSAGE_PARTS, (table) => {
          table.bigIncrements('id').primary().index();
          table.text('file_name').index();
          table.text('mime_type');
          table.string('part_computed_hash').unique().notNullable();
          table.text('sp_part_id');
          table.json('headers');
          table.boolean('is_root_part').defaultTo(false);
          table.json('body');
          table.boolean('is_attachment').defaultTo(false);
          table.boolean('is_attachment_uploaded_to_s3').defaultTo(false);
          table.text('attachment_id');
          table.text('attachment_url');
          table.text('part_to'); // store the to fields as serialized string
          table.text('part_from');
          table.text('cc');
          table.text('bcc');
          table.text('subject');
          table.dateTime('part_datetime');
          table.text('body_data');
          table.bigInteger('body_size');
          table.string('sp_message_id');
          table
            .integer('message_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable(`${schema}.${Table.THREAD_MESSAGES}`);
        })
    );
}
