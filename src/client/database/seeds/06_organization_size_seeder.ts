import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

export function seed(knex: Knex): Promise<any> {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  const organizationSizeRecords = [
    { min: 1, max: 10, size_key: '1_10', size: '1 - 10 employees' },
    {
      min: 11,
      max: 50,
      size_key: '11_50',
      size: '11 - 50 employees'
    },
    {
      min: 51,
      max: 200,
      size_key: '51_200',
      size: '51 - 200 employees'
    },
    {
      min: 201,
      max: 500,
      size_key: '201_500',
      size: '201 - 500 employees'
    },
    {
      min: 501,
      max: 1000,
      size_key: '501_1000',
      size: '501 - 1000 employees'
    },
    {
      min: 1001,
      max: 5000,
      size_key: '1001_5000',
      size: '1001 - 5000 employees'
    },
    {
      min: 5001,
      max: 10000,
      size_key: '5001_10000',
      size: '5001 - 10,000 employees'
    },
    {
      min: 10001,
      max: 2147483647,
      size_key: '10000+',
      size: '10,001+ employees'
    }
  ];

  return knex(
    `${knex.client.config.userParams.schemaName}.${Table.ORGANIZATION_SIZES}`
  ).insert(organizationSizeRecords);
}
