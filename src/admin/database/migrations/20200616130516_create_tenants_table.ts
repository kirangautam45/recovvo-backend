import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';

/**
 * Create Tenant database
 * @param knex Promise
 */
export function up(knex: Knex): Knex.SchemaBuilder {
  return knex.schema.createTable(Table.TENANTS, (table) => {
    table.increments('id').primary();
    table.string('slug').unique().notNullable();
    table.boolean('is_schema_created').defaultTo(false);
    table.timestamps(true, true);
  });
}

/**
 * Drop Tenant database
 * @param knex Promise
 */
export function down(knex: Knex): Knex.SchemaBuilder {
  return knex.schema.dropTable(Table.TENANTS);
}
