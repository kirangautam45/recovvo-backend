import * as dotenv from 'dotenv';

dotenv.config();

module.exports = {
  development: {
    client: process.env.DB_CLIENT,
    connection: {
      charset: 'utf8',
      timezone: 'UTC',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.COMMON_DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    pool: {
      min: 2,
      max: 3
    },
    migrations: {
      directory: 'src/admin/database/migrations',
      tableName: 'migrations',
      stub: 'src/core/common/stubs/migration.stub'
    },
    seeds: {
      directory: 'src/admin/database/seeds',
      stub: 'src/core/common/stubs/seed.stub'
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
      database: process.env.TEST_DB_COMMON_NAME
    },
    migrations: {
      directory: 'src/admin/database/migrations',
      tableName: 'migrations'
    },
    seeds: {
      directory: 'src/admin/database/seeds'
    }
  }
};
