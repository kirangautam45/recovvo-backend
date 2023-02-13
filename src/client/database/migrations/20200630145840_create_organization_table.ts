import * as Knex from 'knex';
import logger from '../../../core/utils/logger';
import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

/**
 * Add organization table
 * @param {Knex} knex
 */
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
    .dropTable(Table.ORGANIZATION);
}

function schemaUp(knex: Knex, schema: string) {
  return knex.schema
    .withSchema(schema)
    .createTable(Table.ORGANIZATION, (table) => {
      table.increments('id').primary();
      table.string('url');
      table.string('name').notNullable();
      table.boolean('is_deleted').defaultTo(false);
      table
        .integer('organization_size_id')
        .unsigned()
        .references('id')
        .inTable(`${schema}.${Table.ORGANIZATION_SIZES}`);
      table
        .integer('industry_type_id')
        .unsigned()
        .references('id')
        .inTable(`${schema}.${Table.INDUSTRY_TYPES}`);
      table.timestamps(true, true);
      table.index('id');
    });
}
