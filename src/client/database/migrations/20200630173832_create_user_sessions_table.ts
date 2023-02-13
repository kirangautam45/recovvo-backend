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
    .dropTable(Table.SESSION);
}

function schemaUp(knex: Knex, schema: string) {
  return knex.schema.withSchema(schema).createTable(Table.SESSION, (table) => {
    table.increments('id').primary();
    table.text('token').notNullable();
    table.json('payload');
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable(`${schema}.${Table.PROVIDER_USERS}`);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.index('token');
    table.timestamps(true, true);
  });
}
