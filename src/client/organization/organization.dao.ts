import Organization from './organization.model';
import logger from '../../core/utils/logger';

/**
 * Find one organization by query
 *
 * @param query object
 */
export async function findOne(schema: string, query: any): Promise<any> {
  logger.log(
    'info',
    `Fetching organization by query ${JSON.stringify(
      query
    )} for tenant with schema ${schema}`
  );
  return await Organization.findFirstRecord(schema, query);
}

/**
 * Update by id
 * @param id number
 * @param params object
 */
export async function updateById(schema: string, id: number, params: any) {
  logger.log('info', `Updating Organization with id ${id} with ${params}`);
  return await Organization.updateOrganization(schema, { id }, params);
}
