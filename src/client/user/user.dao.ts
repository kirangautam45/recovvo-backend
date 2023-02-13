import User from './user.model';
import { Transaction } from 'knex';
import logger from '../../core/utils/logger';
import roleMapper from './mapper/role.mapper';
import IUser from './interfaces/user.interface';
import UserPayload from './dto/userPayload.dto';
import JWTPayload from '../auth/dto/jwtPayload.dto';
import ISupervisor from './interfaces/supervisor.interface';
import UserSupervisor from '../userMappings/userSupervisor.model';
import ISuppressedUser from '../suppressionList/interfaces/suppressedUser.interface';

/**
 * Fetch all users from database
 *
 * @returns Promise
 */
export async function fetchAll(schema: string): Promise<IUser[]> {
  logger.log('info', 'Fetching users from database');

  return User.buildFindQuery(schema).then((result: IUser) => {
    return result;
  });
}

/**
 * Find user by query
 *
 * @param query object
 */
export async function find(
  schema: string,
  query: any
): Promise<IUser[] | null> {
  logger.log(
    'info',
    `Fetching user by query from database ${JSON.stringify(query)}`
  );
  return await User.find(query).withSchema(schema);
}

/**
 * Find users by emails
 *
 * @param emails string[]
 */
export async function findByEmailWhereIn(
  schema: string,
  query: any,
  emails: string[]
): Promise<IUser[]> {
  logger.log('info', 'Fetching users by emails from database', [
    ...new Set(emails)
  ]);
  return await User.findUserWhereEmailIn(schema, query, [...new Set(emails)]);
}

/**
 * Update users by emails
 *
 * @param emails string[]
 */
export async function updateByEmailWhereIn(
  schema: string,
  emails: string[],
  query: any
): Promise<number> {
  logger.log('info', 'Updating users from database', emails);
  return await User.updateByEmailsIn(schema, emails, query);
}

/**
 * Find one user by query
 *
 * @param query object
 */
export async function findOne(
  schema: string,
  query: any
): Promise<IUser | null> {
  return await User.findOne(schema, query);
}

/**
 * Create user
 * @param userPayload object
 */
export async function create(
  schema: string,
  userPayload: UserPayload,
  tx?: Transaction
): Promise<IUser> {
  logger.log('info', 'Creating new normal user', userPayload);

  const [user] = await User.create(schema, userPayload, tx);

  return user;
}

/**
 * Update user to activate
 *
 * @param id number
 * @returns Promise
 */
export async function add(
  schema: string,
  id: number,
  updateParams: any
): Promise<IUser> {
  logger.log('info', 'Updating user information', updateParams);
  const [user] = await User.updateUser(schema, { id }, updateParams);

  return user;
}

/**
 * Update user
 *
 * @param id number
 * @returns Promise
 */
export async function update(
  schema: string,
  searchParams: any,
  updateParams: any
): Promise<IUser> {
  logger.log('info', 'Updating user information', searchParams, updateParams);
  const [user] = await User.updateUser(schema, searchParams, updateParams);

  return user;
}

/* Fetch user with pagination
 *
 * @param query string
 * @param params pageNumber
 * @returns Pagination result
 */
//  Params : interface PaginationParams {

export async function fetchPaginatedUser(
  schema: string,
  loggedInPayload: JWTPayload,
  search: string,
  pageParams: { pageSize: number; page: number },
  sortParams: { field?: string; direction?: string }[],
  filter: { [key: string]: any }
): Promise<any> {
  logger.log('info', `Fetching paginated user from database with filter`);
  if (loggedInPayload.role === roleMapper.SUPERVISOR) {
    const userSupervisors = await UserSupervisor.find({
      supervisorId: loggedInPayload.userId,
      isDeleted: false
    })
      .withSchema(schema)
      .pluck('user_id');
    userSupervisors.push(String(loggedInPayload.userId));
    return User.findUserWithPageAndSort(
      schema,
      filter,
      pageParams,
      sortParams,
      search
    )
      .whereIn('provider_users.id', userSupervisors)
      .whereNot('provider_users.id', loggedInPayload.userId);
  }
  return User.findUserWithPageAndSort(
    schema,
    filter,
    pageParams,
    sortParams,
    search
  ).whereNot('provider_users.id', loggedInPayload.userId);
}

/**
 * Find user by query
 *
 * @param id number
 */
export async function findById(
  schema: string,
  id: number
): Promise<IUser | null> {
  logger.log('info', `Fetching user by id ${id} from schema ${schema}`);
  return await User.findById(schema, id);
}

/**
 * Find user by query
 *
 * @param ids array
 */
export async function findByIds(
  schema: string,
  ids: number[]
): Promise<IUser[] | null> {
  logger.log('info', 'Fetching users by id from database', ids);
  return User.findByIds(schema, ids).then((result: IUser) => {
    return result;
  });
}

/**
 * Find user by query
 *
 * @param id number
 */
export async function findAppUserById(
  schema: string,
  id: number
): Promise<IUser | null> {
  logger.log('info', 'Fetching app  user by id from database', id);
  return await User.findAppUserById(schema, id);
}

/**
 * Find user by email
 *
 * @param email string
 */
export async function findByEmail(
  schema: string,
  email: string
): Promise<IUser | null> {
  logger.log('info', 'Fetching user by email from database %s', email);
  return await User.findByEmail(schema, email);
}

/**
 * Deactivate user
 *
 * @param id number
 */
export async function deactivate(schema: string, id: number): Promise<IUser> {
  logger.log('info', 'Deactivating user', { id });
  const [user] = await User.updateUser(
    schema,
    { id },
    {
      isActive: false,
      isAdmin: false,
      isSupervisor: false
    }
  );

  return user;
}

/**
 * Update by id
 * @param id number
 * @param params object
 */
export async function updateById(
  schema: string,
  id: number,
  params: any
): Promise<IUser[] | null> {
  logger.log('info', `Update user with id ${id} with parameters ${params}`);
  return await User.updateUser(schema, { id }, params);
}

/**
 * Find all possible supervisors
 *
 * @param id number
 */
export async function findPossibleSupervisor(
  schema: string,
  userIds: number[],
  searchQuery: string,
  maxRows: number
): Promise<ISupervisor[] | null> {
  logger.log(
    'info',
    'Fetching all possible supervisors for user with id',
    userIds.join(',')
  );

  return User.buildPossibleSupervisorQuery(
    schema,
    userIds,
    searchQuery,
    maxRows
  );
}

/**
 * Find suppressed users by search query
 *
 * @param searchQuery string
 * @param maxRows number
 */
export async function searchSuppressedUsersSuggestion(
  schema: string,
  searchQuery: string,
  maxRows: number
): Promise<string[]> {
  logger.log(
    'info',
    `Fetching suppressed users by search query ${searchQuery} `
  );

  return User.searchSuppressedUsersSuggestion(
    schema,
    searchQuery,
    maxRows
  ).pluck('email');
}

/**
 * Find suppressed users by search query
 *
 * @param searchQuery string
 * @param maxRows number
 */
export async function searchSuppressedUsers(
  schema: string,
  searchQuery: string,
  maxRows: number
): Promise<ISuppressedUser[]> {
  logger.log(
    'info',
    `Fetching suppressed users by search query ${searchQuery} `
  );

  return User.searchSuppressedUsers(schema, searchQuery, maxRows).then(
    (result: ISuppressedUser) => {
      return result;
    }
  );
}

/**
 * Find user suggestions by search query
 *
 * @param searchQuery string
 * @param maxRows number
 */
export async function fetchUserSuggestionByQuery(
  schema: string,
  searchQuery: string,
  maxRows: number
): Promise<string[]> {
  logger.log(
    'info',
    `Fetching user suggestions by search query ${searchQuery} `
  );

  return User.fetchUserSuggestionByQuery(schema, searchQuery, maxRows).pluck(
    'email'
  );
}

/**
 * Returns count of total Tenants
 */
export async function fetchTotalUserCount(schema: string) {
  logger.info('Counting user');
  return await User.totalCount(schema);
}
