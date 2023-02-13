import Industry from './industry.model';
import Table from '../common/enums/table.enum';
import logger from '../../core/utils/logger';

/**
 * Fetch all industry types
 * @returns {value: number, label: string}[]
 */
export async function fetchOptions(schema: string) {
  logger.info('Fetching industry-types option for schema', schema);
  const result: any = await Industry.query(
    `SELECT industry_key as value, industry_type as label from ${schema}.${Table.INDUSTRY_TYPES}`
  );

  return result.rows;
}

/**
 * Find one industry by query
 *
 * @param query object
 */
export async function findOne(schema: string, query: any): Promise<any> {
  logger.log('info', 'Fetching industry by query from database', query);
  return await Industry.findFirstRecord(schema, query);
}
