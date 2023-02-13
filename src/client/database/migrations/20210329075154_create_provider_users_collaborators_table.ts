import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .createTable(Table.PROVIDER_USERS_COLLABORATORS, (table) => {
      table
        .integer('user_id') // user giving access
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(`${schema}.${Table.PROVIDER_USERS}`)
        .onDelete('CASCADE');
      table
        .integer('collaborator_id') //user receiveing access
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(`${schema}.${Table.PROVIDER_USERS}`)
        .onDelete('CASCADE');
      table.boolean('use_default_duration').defaultTo(true);
      table.dateTime('collaboration_start_date');
      table.dateTime('collaboration_end_date');
      table.boolean('is_deleted').defaultTo(false);

      table.timestamps(true, true);
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  return knex.schema.dropTable(Table.PROVIDER_USERS_COLLABORATORS);
}
