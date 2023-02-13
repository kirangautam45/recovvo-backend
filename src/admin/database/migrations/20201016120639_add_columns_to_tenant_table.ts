import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  return knex.schema.alterTable(Table.TENANTS, (table) => {
    table.string('organization_name');
    table.string('organization_admin_first_name');
    table.string('organization_admin_last_name');
    table.string('organization_admin_email').unique();
    table
      .integer('added_by_id')
      .unsigned()
      .references('id')
      .inTable(Table.SUPER_ADMINS);
    table.boolean('is_active').defaultTo(false);
    table.boolean('is_deleted').defaultTo(false);
  });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  return knex.schema.alterTable(Table.TENANTS, (table) => {
    table.dropColumn('organization_name');
    table.dropColumn('organization_admin_first_name');
    table.dropColumn('organization_admin_last_name');
    table.dropColumn('organization_admin_email');
    table.dropColumn('added_by_id');
    table.dropColumn('is_active');
  });
}
