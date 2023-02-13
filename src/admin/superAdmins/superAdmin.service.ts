import * as superAdminDao from './superAdmin.dao';
import logger from '../../core/utils/logger';
import SuperAdminDto from './superAdmin.dto';

/**
 * Fetch super admin from email
 */
export async function fetchFromEmail(email: string): Promise<SuperAdminDto> {
  logger.log('info', 'Fetching super admin details with email: %s', email);

  return await superAdminDao.fetchFromEmail(email);
}
