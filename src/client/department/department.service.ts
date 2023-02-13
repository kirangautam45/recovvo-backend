import logger from '../../core/utils/logger';
import * as departmentDao from './department.dao';

/**
 * Fetch all department type options
 */
export async function fetchOptions(schema: string) {
  logger.info('Fetching all department types for schema', schema);
  return departmentDao.fetchOptions(schema);
}
