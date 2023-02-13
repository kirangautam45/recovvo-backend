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
    .dropTable(Table.PROVIDERS);
}

function schemaUp(knex: Knex, schema: string) {
  return knex.schema
    .withSchema(schema)
    .createTable(Table.PROVIDERS, (table) => {
      table.increments('id').primary().index();
      table
        .integer('organization_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(`${schema}.${Table.ORGANIZATION}`)
        .onDelete('CASCADE');
      table.json('credentials').notNullable();
      table.string('token');
      table.string('service_type').notNullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.index('id');
    });
}
