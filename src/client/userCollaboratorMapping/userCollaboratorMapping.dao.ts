import * as userDao from '../user/user.dao';
import logger from '../../core/utils/logger';
import UserCollaborator from './userCollaboratorMapping.model';
import UserCollaboratorMapping from './userCollaboratorMapping.model';
import IUserCollaborator from './interfaces/UserCollaborator.interface';
import CollaboratorsUpdatePayload from './dto/collaboratorUpdatePayload';

/**
 * Find user collaborator mapping by collaborator ids
 * @param collaboratorIds number[]
 * @param id number
 */
export async function findCollaborators(
  schema: string,
  collaboratorIds: number[],
  userId: number,
  searchParam: string
): Promise<IUserCollaborator[] | null> {
  logger.log(
    'info',
    `Fetching collaborator users having ids ${collaboratorIds} from schema ${schema}`
  );

  return await UserCollaborator.findByIds(
    schema,
    collaboratorIds,
    userId,
    searchParam
  );
}

/**
 * Find user collaborator mappings by query
 * @param schema string
 * @param query object
 */
export async function find(
  schema: string,
  query: any
): Promise<[IUserCollaborator]> {
  logger.log(
    'info',
    'Fetching user collaborator mapping by query from database',
    query
  );

  return await UserCollaboratorMapping.find(query).withSchema(schema);
}

/**
 * Find Active collaborator by user Id
 * @param schema
 * @param userId
 * @returns
 */
export async function findActiveCollaboratorsByUserId(
  schema: string,
  userId: number
) {
  logger.log('info', 'Fetching active collaborators by user id', userId);

  return await UserCollaboratorMapping.fetchActiveCollaboratorByUserId(
    schema,
    userId
  );
}

/**
 * Find user collaborator mapping by query
 * @param schema string
 * @param query object
 */
export async function findOne(
  schema: string,
  query: any
): Promise<UserCollaborator | null> {
  logger.log(
    'info',
    'Fetching one user collaborator mapping by query from database',
    query
  );
  const userCollaborator = await UserCollaboratorMapping.find(query)
    .withSchema(schema)
    .limit(1);

  return userCollaborator[0];
}

/**
 * Create user collaborator mapping
 * @param schema string
 * @param userCollaboratorPayload object
 */
export async function create(
  schema: string,
  userCollaboratorPayload: IUserCollaborator
): Promise<IUserCollaborator> {
  logger.log(
    'info',
    'Creating new user collaborator mapping',
    userCollaboratorPayload
  );

  const [userCollaborator] = await UserCollaboratorMapping.create({
    schema,
    data: userCollaboratorPayload
  });

  return userCollaborator;
}

/**
 * Update collaborator mapping
 *
 * @param userId number
 * @param query any
 * @returns object[]
 */
export async function update(
  schema: string,
  searchQuery: any,
  query: any
): Promise<IUserCollaborator> {
  logger.log('info', 'Updating collaborator mapping of user with', searchQuery);
  const [userCollaborator] = await UserCollaboratorMapping.update(
    schema,
    searchQuery,
    query
  );

  return userCollaborator;
}

/**
 * Find all possible collaborator
 * @param schema string
 * @param userId number
 * @param existingCollaboratorIds number[]
 */
export async function findPossibleCollaborator(
  schema: string,
  userId: number,
  existingCollaboratorIds: number[],
  searchQuery?: string,
  maxRows?: number
): Promise<IUserCollaborator[] | null> {
  logger.log(
    'info',
    'Fetching all possible collaborators for user with id',
    userId
  );

  return UserCollaboratorMapping.buildPossibleCollaboratorQuery(
    schema,
    userId,
    existingCollaboratorIds,
    searchQuery,
    maxRows
  );
}

/**
 * Find by id and update
 * @param schema string
 * @param id number Collaborator id
 * @param updateInfo object
 */
export async function findAndUpdate(
  schema: string,
  email: string,
  updateInfo: CollaboratorsUpdatePayload
): Promise<any> {
  logger.log(
    'info',
    'Updating user collaborator table based on collaborator email',
    email
  );
  const user = await userDao.findByEmail(schema, email);

  const { accessStartDate, accessEndDate, ...rest } = updateInfo;
  const collaborationStartDate = accessStartDate;
  const collaborationEndDate = accessEndDate;

  return await UserCollaborator.update(
    schema,
    { collaboratorId: user?.id },
    {
      ...rest,
      collaborationStartDate,
      collaborationEndDate
    }
  );
}

/**
 * Remove all associated collaborators associated with particular userId.
 *
 * @param schema string
 * @param userId userId
 */
export async function removeAllCollaboratorsWithUserId(
  schema: string,
  userId: number | string
) {
  return await UserCollaborator.update(schema, { userId }, { isDeleted: true });
}

/**
 * Finds as alias based on userId.
 *
 * @param {String} schema
 * @param {Number} userId
 * @param {String} searchParam
 * @returns Promise
 */
export async function findByUserIdWithSearchParams(
  schema: string,
  userId: number,
  searchParam: string
): Promise<any[]> {
  logger.log(
    'info',
    'Fetching user alias mapping by userId and searchparam from database',
    userId
  );

  return await UserCollaborator.findByUserIdWithSearchParams(
    schema,
    userId,
    searchParam
  );
}

/**
 * Gets total count of collaborators of users with given supervisorId.
 *
 * @param {String} schema
 * @param {Number} userId
 * @param {String} searchParam
 * @returns Promise
 */
export function getTotalCountOfCollaborators(
  schema: string,
  userId: number
): Promise<any[]> {
  logger.log(
    'info',
    'Fetching user alias mapping by userId and searchparam from database',
    userId
  );

  return UserCollaborator.getTotalCountOfCollaborators(schema, userId);
}
