import UserSession from './userSession.model';
import IUserSession from './interfaces/userSession.interface';
import UserSessionPayload from './dto/userSessionPayload.dto';

/**
 * Create User Session
 *
 * @param userSession object
 * @returns Promise
 */
export async function create(
  schema: string,
  userSession: UserSessionPayload
): Promise<IUserSession> {
  const [session] = await UserSession.create(schema, {
    userId: userSession.userId,
    token: userSession.token
  });

  return session;
}

/**
 * Fetch user session by query
 *
 * @param query object
 * @returns Promise
 */
export async function fetch(schema: string, query: any) {
  return UserSession.find(query).withSchema(schema);
}

/**
 * Remove user session by token
 *
 * @param token string
 * @returns Promise
 */
export async function remove(
  schema: string,
  token: string
): Promise<IUserSession> {
  const [userSession] = await UserSession.updateUserSession(
    schema,
    { token },
    { isActive: false }
  );

  return userSession;
}
