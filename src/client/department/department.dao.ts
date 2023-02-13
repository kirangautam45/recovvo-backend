import Department from './department.model';
import Table from '../common/enums/table.enum';
import logger from '../../core/utils/logger';

/**
 * Fetch all department types
 * @returns {value: number, label: string}[]
 */
export async function fetchOptions(schema: string) {
  const result: any = await Department.query(
    `SELECT department_key as value, department as label from ${schema}.${Table.DEPARTMENTS}`
  );

  return result.rows;
}

/**
 * Find one department by query
 *
 * @param query object
 */
export async function findOne(schema: string, query: any): Promise<any> {
  logger.log('info', 'Fetching department by query from database', query);
  return await Department.findFirstRecord(schema, query);
}
