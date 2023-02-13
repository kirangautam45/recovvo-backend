import * as Knex from 'knex';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

export function up(knex: Knex): Promise<any> {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return knex.raw(
    `CREATE SCHEMA IF NOT EXISTS ${knex.client.config.userParams.schemaName}`
  );
}

export function down(knex: Knex): Promise<any> {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return knex.raw(`DROP SCHEMA ${knex.client.config.userParams.schemaName}`);
}
