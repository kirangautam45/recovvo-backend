import logger from '../../core/utils/logger';
import * as industryDao from './industry.dao';

/**
 * Fetch all industry types
 */
export async function fetchOptions(schema: string) {
  logger.info('Fetching all industry types for schema', schema);
  return industryDao.fetchOptions(schema);
}
