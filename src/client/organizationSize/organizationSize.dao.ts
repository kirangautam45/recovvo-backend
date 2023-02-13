import OrganizationSize from './organizationSize.model';
import Table from '../common/enums/table.enum';
import logger from '../../core/utils/logger';

/**
 * Fetch all organization sizes
 * @returns {value: number, label: string}[]
 */
export async function fetchOptions(schema: string) {
  const result: any = await OrganizationSize.query(
    `SELECT size_key as value, size as label, max, min from "${schema}"."${Table.ORGANIZATION_SIZES}"`
  );

  return result.rows;
}

/**
 * Find one organization size by query
 *
 * @param query object
 */
export async function findOne(schema: string, query: any): Promise<any> {
  logger.log(
    'info',
    'Fetching organization size by query from database',
    query
  );
  return await OrganizationSize.findFirstRecord(schema, query);
}
