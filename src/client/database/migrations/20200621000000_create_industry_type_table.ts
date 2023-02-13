import * as Knex from 'knex';
import logger from '../../../core/utils/logger';
import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

import { seed } from '../seeds/05_industry_type_seeder';

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
    .dropTable(Table.INDUSTRY_TYPES);
}

function schemaUp(knex: Knex, schema: string) {
  return knex.schema
    .withSchema(schema)
    .createTable(Table.INDUSTRY_TYPES, (table) => {
      table.increments('id').primary().index();
      table.string('industry_type');
      table.string('industry_key').unique().index();
      table.timestamps(true, true);
    });
}
