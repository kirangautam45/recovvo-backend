import * as Knex from 'knex';
import logger from '../../../core/utils/logger';
import Table from '../../common/enums/table.enum';
import OnboardingStatuses from '../../common/constants/oboardingSteps';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

import { seed } from '../seeds/01_organization_table_seeder';

/**
 * Add organization_operation table
 * @param {Knex} knex
 */
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
    .dropTable(Table.ORGANIZATION_OPERATION);
}

function schemaUp(knex: Knex, schema: string) {
  return knex.schema
    .withSchema(schema)
    .createTable(Table.ORGANIZATION_OPERATION, (table) => {
      table.increments('id').primary();
      table.string('slug').unique().notNullable();
      table
        .integer('organization_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(`${schema}.${Table.ORGANIZATION}`)
        .onDelete('CASCADE');
      table.integer('onboarding_page').defaultTo(0);
      table
        .string('onboarding_step')
        .defaultTo(OnboardingStatuses.onboardingStatus.NOT_STARTED.value); // String that defines the client onboarding step
      table.boolean('is_initial_fetch_completed').defaultTo(false); // true after the first email fetch is completed
      table.string('token').unique().notNullable(); // Token to be used for validating the activation of the organization by the SuperAdmin
      table.boolean('is_suppression_list_enabled').defaultTo(true);
      table.boolean('is_deleted').defaultTo(false);
      table.integer('initial_fetch_task_id');
      table.timestamps(true, true);
    });
}
