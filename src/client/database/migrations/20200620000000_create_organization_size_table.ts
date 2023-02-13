import * as Knex from 'knex';
import logger from '../../../core/utils/logger';
import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

import { seed } from '../seeds/06_organization_size_seeder';

export function up(knex: Knex): Promise<any> {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return schemaUp(knex, knex.client.config.userParams.schemaName)
    .then(() => seed(knex))
    .catch((err) => {
      logger.debug('Error', err);
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return knex.schema
    .withSchema(knex.client.config.userParams.schemaName)
    .dropTable(Table.ORGANIZATION_SIZES);
}

function schemaUp(knex: Knex, schema: string) {
  return knex.schema
    .withSchema(schema)
    .createTable(Table.ORGANIZATION_SIZES, (table) => {
      table.increments('id').primary().index();
      table.string('size');
      table.integer('min');
      table.integer('max');
      table.string('size_key').unique().index();
      table.timestamps(true, true);
    });
}
