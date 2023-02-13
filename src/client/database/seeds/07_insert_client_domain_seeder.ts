import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

export function seed(knex: Knex): Promise<any> {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  return knex(
    `${knex.client.config.userParams.schemaName}.${Table.CLIENT_DOMAINS}`
  )
    .del()
    .then(() => {
      const data = [
        {
          domain: 'gmail.com',
          is_deleted: false
        },
        {
          domain: 'lftechnology.com',
          is_deleted: false
        }
      ];

      return knex(
        `${knex.client.config.userParams.schemaName}.${Table.CLIENT_DOMAINS}`
      ).insert(data);
    });
}
