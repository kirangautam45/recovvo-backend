import * as Knex from 'knex';
import Table from '../../common/enums/table.enum';
import SchemaMigrationError from '../../../core/exceptions/SchemaMigrationError';

export function seed(knex: Knex): Promise<any> {
  if (!knex.client.config.userParams.schemaName) {
    throw new SchemaMigrationError();
  }

  const organization = {
    url: process.env.ORGANIZATION_URL,
    name: process.env.ORGANIZATION_NAME,
    slug: process.env.SCHEMA_NAME
  };

  if (!organization.slug) {
    throw new Error('Organization slug not provided');
  }

  return knex(
    `${knex.client.config.userParams.schemaName}.${Table.ORGANIZATION}`
  )
    .insert([
      {
        id: 1,
        url: organization.url,
        name: organization.name
      }
    ])
    .then(() =>
      knex(
        `${knex.client.config.userParams.schemaName}.${Table.ORGANIZATION_OPERATION}`
      ).insert([
        {
          id: 1,
          organization_id: 1,
          slug: organization.slug,
          token: `${organization.slug}_recovvo_token`
        }
      ])
    );
}
