import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

export function seed(knex: Knex): Promise<any> {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  const admin = {
    firstName: process.env.ADMIN_FIRSTNAME,
    lastName: process.env.ADMIN_LASTNAME,
    email: process.env.ADMIN_EMAIL
  };

  if (!Object.values(admin).every((val) => !!val)) {
    throw new Error('Admin data not sufficient');
  }

  return knex(`${Table.PROVIDER_USERS}`)
    .withSchema(knex.client.config.userParams.schemaName)
    .returning(['id', 'first_name'])
    .insert([
      {
        first_name: admin.firstName,
        last_name: admin.lastName,
        email: admin.email,
        is_app_user: false,
        is_active: false,
        is_admin: true,
        is_verified: true,
        organization_id: 1
      }
    ]);
}
