import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';

export function up(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema
    .withSchema(schema)
    .alterTable(Table.ORGANIZATION_OPERATION, (table) => {
      table.boolean('is_default_alias_expiry_set').defaultTo(false);
      table.boolean('is_default_collaborator_expiry_set').defaultTo(false);
      table.integer('default_alias_expiry_duration'); // to be given in days
      table.integer('default_collaborator_expiry_duration'); // to be given in days
      table.boolean('is_org_email_access_limit_set').defaultTo(false);
      table.dateTime('org_email_access_start_date');
      table.dateTime('org_email_access_end_date');
    });
}

export function down(knex: Knex): Knex.SchemaBuilder {
  const schema = knex.client.config.userParams.schemaName;

  return knex.schema.withSchema(schema).alterTable(Table.PROVIDERS, (table) => {
    table.dropColumn('is_default_alias_expiry_set');
    table.dropColumn('is_default_collaborator_expiry_set');
    table.dropColumn('default_alias_expiry_duration');
    table.dropColumn('defaul_collaborator_expiry_duration');
  });
}
