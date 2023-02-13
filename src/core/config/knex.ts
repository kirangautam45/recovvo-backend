import Knex from 'knex';
import * as dotenv from 'dotenv';
import toSnakeCase from 'to-snake-case';
import camelcaseKeys from 'camelcase-keys';

dotenv.config();

/**
 * Get knex object from db instance
 * Different for each tenants
 * @param dbName string
 */
export const getKnexInstanceFromDbName: any = (dbName: string) => {
  return Knex(getDbConfig(dbName));
};

/**
 * Get Database config
 * @param dbName string
 */
export function getDbConfig(dbName: string) {
  return {
    client: process.env.DB_CLIENT,
    connection: {
      charset: 'utf8',
      timezone: 'UTC',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT || '5432'),
      database: dbName,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      pool: {
        min: 2,
        max: 3,
        createTimeoutMillis: 3000,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,
        propagateCreateError: false // <- default is true, set to false
      }
    },
    wrapIdentifier: (value: any, origImpl: any) => {
      if (value === '*') {
        return origImpl(value);
      }
      return origImpl(toSnakeCase(value));
    },
    postProcessResponse: (result: string | any[]) => {
      if (Array.isArray(result)) {
        if (
          result.length === 0 ||
          !result[0] ||
          typeof result[0] !== 'object'
        ) {
          return result;
        }
        return camelcaseKeys(result, { deep: true });
      }
      return result;
    }
  };
}

export const commonDbKnex = Knex(
  getDbConfig(process.env.COMMON_DB_NAME || 'db_common')
);

export const tenantConnection = getKnexInstanceFromDbName(
  process.env.LOCAL_DB_NAME
);
