import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

export function seed(knex: Knex): Promise<any> {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  const departmentRecords = [
    {
      department_key: 'founder_ceo_gm',
      department: 'Founder/CEO/GM'
    },
    {
      department_key: 'sales_client_management',
      department: 'Sales/Client Management'
    },
    {
      department_key: 'client_success_support',
      department: 'Client Success or Support'
    },
    {
      department_key: 'sales_client_consulting_op',
      department: 'Sales/Client/Consulting Operations'
    },
    {
      department_key: 'sales_enablement',
      department: 'Sales Enablement'
    },
    { department_key: 'consulting', department: 'Consulting' },
    { department_key: 'marketing', department: 'Marketing' },
    { department_key: 'hr', department: 'Human Resources' },
    { department_key: 'it', department: 'Information Technology' },
    {
      department_key: 'legal_compliance',
      department: 'Legal/Compliance'
    }
  ];

  return knex(
    `${knex.client.config.userParams.schemaName}.${Table.DEPARTMENTS}`
  ).insert(departmentRecords);
}
