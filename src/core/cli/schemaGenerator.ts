import Knex from 'knex';
import config from '../config/config';
import * as tenantDao from '../../admin/tenants/tenant.dao';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const knexClientConfig = require('../../../knexfile-client')[
  process.env.NODE_ENV || 'development'
];
const { commonDb: commonDbConfig } = config;

/**
 * Generate Database Schema for a new client.
 *
 * @param {any} input
 * @returns {Promise<AppInfo>}
 */
export async function generate(input: any): Promise<any> {
  const knexConnectionConfig = JSON.parse(JSON.stringify(knexClientConfig));
  const dbConfig = {
    slug: input.slug,
    db: input.dbName
  };

  const dbConn = Knex(knexConnectionConfig);
  dbConn.destroy();

  knexConnectionConfig.connection.database = dbConfig.db;

  const newDbConn = Knex(knexConnectionConfig);
  try {
    await newDbConn.migrate.latest(knexConnectionConfig);
  } catch (error) {
    //log error
    console.warn(error);
  } finally {
    newDbConn.destroy();
  }
}

/**
 * Function that runs migration for all tenant databases
 */
export async function migrateAll() {
  const commonDbKnexConnection = Knex(commonDbConfig);
  const tenants = await commonDbKnexConnection.select('*').from('tenants');
  console.log('Tenants:', tenants, '\n');
  const knexClientConf = JSON.parse(JSON.stringify(knexClientConfig));

  tenants.forEach(async (tenant) => {
    console.log('migrating for tenant', tenant['db_name']);
    knexClientConf.connection.database = tenant['db_name'];
    const tenantDbConn = Knex(knexClientConf);

    await runMigration(tenantDbConn, knexClientConf);
  });
}

/**
 * Function that rollsback all the tenant databases
 */
export async function rollbackAll() {
  const commonDbKnexConnection = Knex(commonDbConfig);
  const tenants = await commonDbKnexConnection.select('*').from('tenants');
  console.log('Tenants:', tenants, '\n');
  console.log(knexClientConfig);
  const knexClientConf = JSON.parse(JSON.stringify(knexClientConfig));

  tenants.forEach(async (tenant) => {
    knexClientConf.connection.database = tenant['db_name'];
    const tenantDbConn = Knex(knexClientConf);

    await runRollback(tenantDbConn, knexClientConf);
  });
}

/**
 * Function that gets the tenant info from slug string and migrates to particular tenant
 * @param slug String
 */
export async function migrateTenant(slug: string): Promise<void> {
  console.log('Running migration on specific client database of slug', slug);

  const tenant = await tenantDao.fetchFromSlug(slug);

  const knexClientConf = JSON.parse(JSON.stringify(knexClientConfig));
  knexClientConf.connection.database = tenant[0].dbName;
  const tenantDbConn = Knex(knexClientConf);

  await runMigration(tenantDbConn, knexClientConf);
}

/**
 * Function that gets the tenant info from slug string and rollsback particular tenant
 * @param slug String
 */
export async function rollbackTenant(slug: string): Promise<void> {
  console.log('Running rollback on specific client database with slug', slug);
  const tenant = await tenantDao.fetchFromSlug(slug);

  const knexClientConf = JSON.parse(JSON.stringify(knexClientConfig));
  knexClientConf.connection.database = tenant[0].dbName;
  const tenantDbConn = Knex(knexClientConf);

  await runRollback(tenantDbConn, knexClientConf);
}

/**
 * Function to run Migration on specific tenant connection
 * @param tenantDbConn tenant Database Connection
 * @param knexClientConf knex Configuration
 */
async function runMigration(tenantDbConn: any, knexClientConf: any) {
  const tenant = knexClientConf.connection.database;
  try {
    console.log('Running migration for tenant', tenant);
    await tenantDbConn.migrate.latest(knexClientConf);
    console.log('Running seed files for tenant', tenant);
    await tenantDbConn.seed.run(knexClientConf);
    process.exit(0);
  } catch (e) {
    console.log(e);
    await tenantDbConn.destroy();
    process.exit(1);
  }
}

async function runRollback(tenantDbConn: any, knexClientConf: any) {
  const tenant = knexClientConf.connection.database;
  try {
    console.log('Rollback for tenant', tenant);
    await tenantDbConn.migrate.rollback(knexClientConf);
    console.log('completed rollback for tenant', tenant);
    await tenantDbConn.destroy();
    process.exit(0);
  } catch (e) {
    console.log(e);
    await tenantDbConn.destroy();
    process.exit(1);
  }
}
