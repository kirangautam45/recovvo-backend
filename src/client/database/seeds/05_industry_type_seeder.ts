import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

export function seed(knex: Knex): Promise<any> {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  const industryTypes = [
    { industry_key: 'software_saas', industry_type: 'Software/SaaS' },
    { industry_key: 'it_services', industry_type: 'IT Services' },
    {
      industry_key: 'financal_services',
      industry_type: 'Financial Services'
    },
    {
      industry_key: 'business_services',
      industry_type: 'Business Services'
    },
    {
      industry_key: 'marketing_advertising',
      industry_type: 'Marketing & Advertising'
    },
    {
      industry_key: 'management_consulting',
      industry_type: 'Management Consulting'
    },
    { industry_key: 'consulting', industry_type: 'Consulting' },
    { industry_key: 'legal', industry_type: 'Legal' },
    { industry_key: 'healthcare', industry_type: 'Healthcare' },
    {
      industry_key: 'pharmaceuticals',
      industry_type: 'Pharmaceuticals'
    },
    {
      industry_key: 'staffing_recruiting',
      industry_type: 'Staffing/Recruiting'
    },
    { industry_key: 'real_Estate', industry_type: 'Real Estate' },
    { industry_key: 'government', industry_type: 'Government' },
    { industry_key: 'other', industry_type: 'Other' }
  ];

  return knex(
    `${knex.client.config.userParams.schemaName}.${Table.INDUSTRY_TYPES}`
  ).insert(industryTypes);
}
