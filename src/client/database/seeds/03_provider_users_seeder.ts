import * as Knex from 'knex';

import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

export function seed(knex: Knex): Promise<any> {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  const users = [
    {
      first_name: 'Spandan',
      last_name: 'Pyakurel',
      email: 'spandanpyakurel@lftechnology.com',
      organization_id: 1
    },
    {
      first_name: 'Shradha',
      last_name: 'Neupane',
      email: 'shradhaneupane@lftechnology.com',
      organization_id: 1
    },
    {
      first_name: 'Robus',
      last_name: 'Gauli',
      email: 'robusgauli@lftechnology.com',
      organization_id: 1
    },
    {
      first_name: 'Sanjeev',
      last_name: 'Shakya',
      email: 'sanjeevshakya@lftechnology.com',
      organization_id: 1
    },
    {
      first_name: 'Grikshmi',
      last_name: 'Manandhar',
      email: 'grikshmimanandhar@lftechnology.com',
      organization_id: 1
    },
    {
      first_name: 'Ayush',
      last_name: 'Shrestha',
      email: 'ayushshrestha@lftechnology.com',
      organization_id: 1
    },
    {
      first_name: 'Nikita',
      last_name: 'Shrestha',
      email: 'nikitashrestha@lftechnology.com',
      organization_id: 1
    },
    {
      first_name: 'Oshan',
      last_name: 'Shrestha',
      email: 'oshanshrestha@lftechnology.com',
      organization_id: 1
    },
    {
      first_name: 'Sagar',
      last_name: 'Yonjan',
      email: 'sagaryonjan@lftechnology.com',
      organization_id: 1
    },
    {
      first_name: 'Indra',
      last_name: 'Poudel',
      email: 'indrapoudel@lftechnology.com',
      organization_id: 1
    },
    {
      first_name: 'Krishna',
      last_name: 'Upadhyay',
      email: 'krishnaupadhyay@lftechnology.com',
      organization_id: 1
    },
    {
      first_name: 'Poonam',
      last_name: 'Shrestha',
      email: 'poonamshrestha@lftechnology.com',
      organization_id: 1
    }
  ];

  return knex(`${Table.PROVIDER_USERS}`)
    .withSchema(knex.client.config.userParams.schemaName)
    .insert(users);
}
