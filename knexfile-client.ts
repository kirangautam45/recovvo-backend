import * as dotenv from 'dotenv';

dotenv.config();

const isCreateSchema = !!process.env.RUN_SCHEMA;
const schemaName = process.env.SCHEMA_NAME;

if (!schemaName) {
  throw new Error('Schema name must be provided');
}

if (isCreateSchema) {
  console.log('info ', 'Schema creation started...');
}

module.exports = {
  development: {
    client: process.env.DB_CLIENT,
    connection: {
      charset: 'utf8',
      timezone: 'UTC',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.LOCAL_DB_NAME, // Note this db name changes with respective tenant through connectionresolver
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      searchPath: [schemaName, 'public']
    },
    pool: {
      min: 2,
      max: 3
    },
    migrations: {
      directory: `src/client/database/migrations`,
      schemaName: !isCreateSchema && schemaName,
      tableName: 'migrations',
      stub: 'src/core/common/stubs/migration.stub'
    },
    seeds: {
      directory: 'src/client/database/seeds',
      stub: 'src/core/common/stubs/seed.stub'
    },
    userParams: {
      schemaName: schemaName
    }
  },
  test: {
    client: process.env.DB_CLIENT,
    connection: {
      charset: 'utf8',
      timezone: 'UTC',
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      port: process.env.DB_PORT,
      password: process.env.DB_PASSWORD,
      database: process.env.TEST_DB_TENANT_NAME
    },
    migrations: {
      directory: 'src/client/database/migrations',
      tableName: 'migrations'
    },
    seeds: {
      directory: 'src/client/database/seeds'
    }
  },
  production: {
    client: process.env.DB_CLIENT,
    connection: {
      charset: 'utf8',
      timezone: 'UTC',
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      port: process.env.DB_PORT,
      password: process.env.DB_PASSWORD,
      database: process.env.LOCAL_DB_NAME
    },
    migrations: {
      directory: 'src/client/database/migrations',
      tableName: 'migrations'
    },
    seeds: {
      directory: 'src/client/database/seeds'
    }
  }
};
