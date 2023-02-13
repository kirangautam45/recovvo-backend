import logger from '../../core/utils/logger';
import * as organizationSizeDao from './organizationSize.dao';

/**
 * Fetch all organization sizes
 */
export async function fetchOptions(schema: string) {
  logger.info('Fetching all organization sizes from schema', schema);
  return organizationSizeDao.fetchOptions(schema);
}
