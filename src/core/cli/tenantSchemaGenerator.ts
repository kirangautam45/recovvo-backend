import Knex from 'knex';
import config from '../config/config';
import SchemaMigrationError from '../../core/exceptions/SchemaMigrationError';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const knexClientConfig = require('../../../knexfile-client')[
  process.env.NODE_ENV || 'development'
];
const { commonDb: commonDbConfig } = config;

async function createSchema(schemaName: string) {
  const knexConnection = Knex({
    client: knexClientConfig.client,
    connection: knexClientConfig.connection
  });

  const isSchemaCreated = await checkIfSchemaAlreadyCreated(schemaName);

  if (isSchemaCreated) {
    console.info('Schema already created.');
  } else {
    console.info('Creating schema...');
    await knexConnection.raw(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

    await setSchemaCreationFlag(schemaName, true);
    console.info('Schema created successfully.');
  }
  process.exit();
}

async function dropSchema(schemaName: string) {
  const knexConnection = Knex(knexClientConfig);

  console.info('Dropping schema...');
  await knexConnection.raw(`DROP SCHEMA ${schemaName}`);

  await setSchemaCreationFlag(schemaName, false);

  console.info('Schema dropped successfully.');
  process.exit();
}

async function checkIfSchemaAlreadyCreated(tenantName: string) {
  const knexConnection = Knex(commonDbConfig);

  const response = await knexConnection('tenants')
    .select({ isSchemaCreated: 'is_schema_created' })
    .where({
      slug: tenantName
    });

  if (!response.length) {
    console.error('Please add tenant in admin before creating its schema.');
    process.exit(1);
  }

  return response[0].isSchemaCreated;
}

async function setSchemaCreationFlag(tenantName: string, flag: boolean) {
  const knexConnection = Knex(commonDbConfig);

  const response = await knexConnection('tenants')
    .returning(['id', 'slug', 'is_schema_created'])
    .update({ is_schema_created: flag })
    .where({ slug: tenantName });

  return response;
}

const action = process.argv[2];
const schemaName = process.argv[3];

if (!schemaName) {
  throw new SchemaMigrationError();
} else if (action === 'create') {
  createSchema(schemaName);
} else if (action === 'drop') {
  dropSchema(schemaName);
} else {
  console.log('Unknown command. Please use either create or drop');
  process.exit();
}
