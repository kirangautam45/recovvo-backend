import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.ORGANIZATION_OPERATION, (table) => {
      table.dropColumn('org_email_access_start_date'); //unrequired field
      table.dropColumn('org_email_access_end_date'); //unrequired field
      table.boolean('is_email_access_time_frame_set').defaultTo(false);
      table.boolean('is_rolling_time_frame_set').defaultTo(false);
      table.date('email_access_start_date').nullable();
      table.float('email_access_time_range_in_years', 4).defaultTo(-1);
      table.integer('email_access_time_range_in_days').defaultTo(-1);
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.ORGANIZATION_OPERATION, (table) => {
      table.dropColumn('is_email_access_time_frame_set');
      table.dropColumn('is_rolling_time_frame_set');
      table.dropColumn('email_access_start_date');
      table.dropColumn('email_access_time_range_in_years');
      table.dropColumn('email_access_time_range_in_days');
      table.dateTime('org_email_access_start_date');
      table.dateTime('org_email_access_end_date');
    });
}
