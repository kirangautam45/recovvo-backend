import logger from '../../core/utils/logger';
import * as userSessionDao from './userSession.dao';
import UserSessionPayload from './dto/userSessionPayload.dto';
import IUserSession from './interfaces/userSession.interface';

/**
 * Create user session
 *
 * @param userSession Object
 * @returns Promise
 */
export async function create(
  schema: string,
  userSession: UserSessionPayload
): Promise<IUserSession> {
  logger.info('User Session: Creating Session -', userSession);

  const session: IUserSession = <IUserSession>(
    await userSessionDao.create(schema, userSession)
  );

  logger.log('debug', 'User Session: Session created successfully -', session);

  return session;
}

/**
 * Fetch Session by token
 *
 * @param token object
 * @returns Promise
 */
export async function fetchByToken(
  schema: string,
  token: string
): Promise<IUserSession> {
  logger.log('info', 'Fetching User Session - %s', token);

  const session: IUserSession = <IUserSession>(
    await userSessionDao.fetch(schema, { token, isActive: true })
  );

  logger.log('info', 'Session is valid');

  return session;
}

/**
 * Remove session by token
 *
 * @param token object
 * @returns Promise
 */
export async function remove(
  schema: string,
  token: string
): Promise<IUserSession> {
  logger.log('info', 'User Session: Deactivating token - %s', token);

  const session: IUserSession = <IUserSession>(
    await userSessionDao.remove(schema, token)
  );

  logger.log('info', 'Session is removed');

  return session;
}
