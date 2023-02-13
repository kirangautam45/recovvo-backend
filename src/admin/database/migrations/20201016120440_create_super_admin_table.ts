import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';

/**
 * Create Super Admin database
 * @param knex Promise
 */
export function up(knex: Knex): Knex.SchemaBuilder {
  return knex.schema.createTable(Table.SUPER_ADMINS, (table) => {
    table.increments('id').primary();
    table.string('email').unique().index().notNullable();
    table.string('first_name');
    table.string('last_name');
    table.boolean('is_deleted').defaultTo(false);

    table.timestamps(true, true);
  });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  return knex.schema.dropTable(Table.SUPER_ADMINS);
}
