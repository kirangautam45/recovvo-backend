import UserSupervisor from './userSupervisor.model';
import logger from '../../core/utils/logger';
import IUserSupervisor from './interfaces/userSupervisor.interface';
import UserSupervisorPayload from './dto/userSupervisorPayload.dto';

/**
 * Fetch all user supervisor mappings from database
 *
 * @returns Promise
 */
export async function fetchAll(schema: string): Promise<IUserSupervisor[]> {
  logger.log('info', 'Fetching users from database');
  return await UserSupervisor.find().withSchema(schema);
}

/**
 * Find user supervisor mapping by query
 *
 * @param query object
 */
export async function find(
  schema: string,
  query: any
): Promise<IUserSupervisor[]> {
  logger.log(
    'info',
    'Fetching user supervisor mapping by query from database',
    query
  );
  return await UserSupervisor.find(query).withSchema(schema);
}

export async function findBySupervisorIdsIn(
  schema: string,
  supervisorIds: number[]
): Promise<IUserSupervisor[]> {
  logger.log(
    'info',
    `Fetching supervisor mappings with supervisorIds ${supervisorIds} `
  );
  return await UserSupervisor.findBySupervisorIds(schema, supervisorIds);
}

/**
 * Find user supervisor mapping by query
 *
 * @param query object
 */
export async function findOne(
  schema: string,
  query: any
): Promise<IUserSupervisor | null> {
  logger.log(
    'info',
    'Fetching one user supervisor mapping by query from database',
    query
  );
  const userSupervisor = await UserSupervisor.find(query)
    .withSchema(schema)
    .limit(1);
  return userSupervisor[0];
}

/**
 * Create user supervisor mapping
 * @param userSupervisorPayload object
 */
export async function create(
  schema: string,
  userSupervisorPayload: UserSupervisorPayload
): Promise<IUserSupervisor> {
  logger.log(
    'info',
    'Creating new user supervisor mapping',
    userSupervisorPayload
  );

  const [userSupervisor] = await UserSupervisor.create(
    schema,
    userSupervisorPayload
  );

  return userSupervisor;
}

/**
 * Update supervisor mapping
 *
 * @param userId number
 * @param query any
 * @returns object[]
 */
export async function update(schema: string, searchQuery: any, query: any) {
  logger.log(
    'info',
    'Updating supervisor mapping with user',
    searchQuery,
    query
  );
  const [userSupervisor] = await UserSupervisor.updateUserSupervisor(
    schema,
    searchQuery,
    query
  );

  return userSupervisor;
}

/**
 * Unlink supervisor mapping
 *
 * @param userId number
 * @returns object[]
 */
export async function unlinkSupervisorMapping(schema: string, userId: number) {
  logger.log('info', 'Unlinking supervisor mapping with user', { userId });
  const [userSupervisor] = await UserSupervisor.updateUserSupervisor(
    schema,
    { userId },
    { isDeleted: true }
  );

  return userSupervisor;
}

/**
 * Gets subordinates of supervisors with given supervisorId and filters the subordinates with searchquery.
 *
 * @param {String} schema
 * @param {Number} userId
 * @param {String} searchParam
 * @returns Promise
 */
export async function fetchSubordinatesWithSearchParams(
  schema: string,
  supervisorId: number,
  searchParam: string
): Promise<any[]> {
  logger.log(
    'info',
    'Fetching user alias mapping by userId and searchparam from database',
    supervisorId
  );

  return await UserSupervisor.findSubordinatesWithSearchParams(
    schema,
    supervisorId,
    searchParam
  );
}

/**
 * Gets total count of subordinates of supervisors with given supervisorId.
 *
 * @param {String} schema
 * @param {Number} userId
 * @param {String} searchParam
 * @returns Promise
 */
export function getTotalCountOfSubordinates(
  schema: string,
  supervisorId: number
): Promise<any[]> {
  logger.log(
    'info',
    'Fetching user alias mapping by userId and searchparam from database',
    supervisorId
  );

  return UserSupervisor.getTotalCountOfSubordinates(schema, supervisorId);
}
