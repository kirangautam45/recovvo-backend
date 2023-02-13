import Knex from 'knex';
import config from '../config/config';
const { commonDb: commonDbConfig } = config;

// TODO: fix the name to match its implementation
async function doesTenantAlreadyExist(tenantName: string) {
  const knexConnection = Knex(commonDbConfig);

  const response = await knexConnection('tenants')
    .select({ isSchemaCreated: 'is_schema_created' })
    .where({
      slug: tenantName
    });

  return !!response.length;
}

/**
 * Generate Database Schema for a new client.
 *
 * @param {any} input
 * @returns {Promise<AppInfo>}
 */
export async function insertTenant(slug: string): Promise<any> {
  const knexConnection = Knex(commonDbConfig);

  if (await doesTenantAlreadyExist(slug)) {
    console.error('Tenant already exists!!!');
    await updateTenantIsActive(slug, true);
    process.exit();
  }

  return knexConnection('tenants')
    .returning(['id', 'slug'])
    .insert({ slug, is_active: 'True' })
    .then((res) => {
      console.log('res: ', res);
      process.exit();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

/**
 * Generate Database Schema for a new client.
 *
 * @param {any} input
 * @returns {Promise<AppInfo>}
 */
export async function updateTenantIsCreated(
  slug: string,
  isCreated: boolean
): Promise<any> {
  const knexConnection = Knex(commonDbConfig);

  const isTenantExist = await doesTenantAlreadyExist(slug);

  if (!isTenantExist) {
    console.error('Tenant does not exists. Please verify name');
    process.exit(1);
  }

  return knexConnection('tenants')
    .returning(['id', 'slug', 'is_schema_created'])
    .update({ is_schema_created: isCreated, is_active: true })
    .where({ slug })
    .then((res) => {
      console.log('res: ', res);
      process.exit();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

/**
 * Update Is active value for new tenant.
 *
 * @param {any} input
 * @returns {Promise<AppInfo>}
 */
export async function updateTenantIsActive(
  slug: string,
  isActive: boolean
): Promise<any> {
  const knexConnection = Knex(commonDbConfig);

  const isTenantExist = await doesTenantAlreadyExist(slug);

  if (!isTenantExist) {
    console.error('Tenant does not exists. Please verify name');
    process.exit(1);
  }

  return knexConnection('tenants')
    .returning(['id', 'slug', 'is_schema_created'])
    .update({ is_active: isActive })
    .where({ slug })
    .then((res) => {
      console.log('res: ', res);
      process.exit();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

const action = process.argv[2];

if (action === 'create') {
  const schemaName = process.argv[3];

  const slug = schemaName;

  insertTenant(slug);
} else if (action === 'update') {
  const slug = process.argv[3];
  const isCreated = process.argv[4] === 'true';

  updateTenantIsCreated(slug, isCreated);
}
