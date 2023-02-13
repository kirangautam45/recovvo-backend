import superAdmin from './superAdmin.model';
import logger from '../../core/utils/logger';
import SuperAdminDto from './superAdmin.dto';

/**
 * Fetch super admin from email
 */
export async function fetchFromEmail(email: string): Promise<SuperAdminDto> {
  logger.log('info', 'Fetching super admin details with email: %s', email);

  return await superAdmin.findFirst({ email, isDeleted: false });
}

/**
 * Fetch super admin from id
 */
export async function fetchById(id: number): Promise<SuperAdminDto> {
  logger.log('info', 'Fetching super admin details with id: %s', id);

  return await superAdmin.findFirst({ id, isDeleted: false });
}
