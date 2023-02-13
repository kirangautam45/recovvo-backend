import Tenant from './tenant.model';
import logger from '../../core/utils/logger';
import TenantDto from './tenant.dto';

/**
 * Insert tenant details
 * @param tenantDetail
 */
export async function insert(tenantDetail: any) {
  logger.log(
    'info',
    'Inserting tenant to common database with values %s',
    JSON.stringify(tenantDetail)
  );

  return await Tenant.insert(tenantDetail);
}

/**
 * Update tenant details
 * @params id Number
 * @params updateParams object
 */
export async function update(id: number, updateParams: any) {
  logger.log(
    'info',
    `Updating Tenant with id ${id} with update params ${JSON.stringify(
      updateParams
    )}`
  );

  return await Tenant.updateById(id, updateParams);
}

/**
 * Fetch all tenants
 */
export async function fetchAll(): Promise<TenantDto[]> {
  logger.log('info', 'Fetching all tenant details');

  return await Tenant.find();
}

/**
 * Fetch tenant from slug
 */
export async function fetchFromSlug(slug: string) {
  logger.log('info', 'Fetching tenant details with slug: %s', slug);

  return await Tenant.find({ slug });
}

/** Fetch tenant from id */
export async function fetchById(id: number) {
  logger.log('info', 'Fetching tenant details with id %s', id);

  return await Tenant.find({ id });
}

/**
 * Fetch list of clients with filtered query and page
 * @param sortPatams Object
 * @param filter Object
 */
export function fetchTenantsWithFilter(
  sortParams: { field: string; direction: string },
  filter?: any
): Promise<any> {
  logger.info(
    'Fetching list of tenants with filter %s',
    JSON.stringify(filter)
  );
  return Tenant.fetchWithFilter(sortParams);
}

/**
 * Returns count of total Tenants
 */
export async function fetchTotalTenantCount() {
  logger.info('Counting tenants');
  return await Tenant.count();
}
