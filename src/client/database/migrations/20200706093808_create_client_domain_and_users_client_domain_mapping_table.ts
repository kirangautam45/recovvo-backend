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
    .dropTable(Table.PROVIDER_USERS_CLIENT_DOMAINS)
    .dropTable(Table.CLIENT_DOMAINS);
}

function schemaUp(knex: Knex, schema: string) {
  return knex.schema
    .withSchema(schema)
    .createTable(Table.CLIENT_DOMAINS, (table) => {
      table.increments('id').primary();
      table.text('domain').unique();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.index('id');
    })
    .then(() =>
      knex.schema
        .withSchema(schema)
        .createTable(Table.PROVIDER_USERS_CLIENT_DOMAINS, (table) => {
          table.increments('id').primary();
          table.boolean('is_deleted').defaultTo(false);
          table
            .integer('provider_user_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable(`${schema}.${Table.PROVIDER_USERS}`)
            .onDelete('CASCADE');
          table
            .integer('client_domain_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable(`${schema}.${Table.CLIENT_DOMAINS}`)
            .onDelete('CASCADE');
          table.dateTime('mapped_date');
          table.timestamps(true, true);
        })
    );
}
