import moment from 'moment';

import User from '../user/user.model';
import UserAlias from './userAlias.model';
import logger from '../../core/utils/logger';
import UserAliasPayload from './dto/userAliasPayload.dto';
import { IUserAlias } from './interfaces/userAlias.interface';
import { DEFAULT_DATE_TIME_FORMAT } from '../common/constants/dateTimeConstants';
import OrganizationOperation from '../organizationOperation/organizationOperation.model';
import * as userSenderReceiverAssociationDao from '../userSenderReceiverAssociation/userSenderReceiverAssociation.dao';

/**
 * Fetch all alias mapping
 * @param schema string
 * @returns Promise
 */
export async function fetchAll(schema: string): Promise<IUserAlias[]> {
  logger.log('info', 'Fetching users from database');

  return await UserAlias.find().withSchema(schema);
}

/**
 * Find as alias based on query
 * @param schema string
 * @param query any
 * @returns Promise
 */
export async function find(schema: string, query: any): Promise<IUserAlias[]> {
  logger.log(
    'info',
    'Fetching user alias mapping by query from database',
    query
  );

  return await UserAlias.find(query).withSchema(schema);
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
): Promise<IUserAlias[]> {
  logger.log(
    'info',
    'Fetching user alias mapping by userId and searchparam from database',
    userId
  );

  return await UserAlias.findByUserIdWithSearchParams(
    schema,
    userId,
    searchParam
  );
}

/**
 * Finds as alias based on userId.
 *
 * @param {String} schema
 * @param {Number} userId
 * @param {String} searchParam
 * @returns Promise
 */
export async function getTotalCountOfUserAliases(
  schema: string,
  userId: number
): Promise<any[]> {
  logger.log(
    'info',
    'Fetching user alias mapping by userId and searchparam from database',
    userId
  );

  return await UserAlias.getTotalCountOfUserAliases(schema, userId);
}

/**
 * Find alias mapping by alias ids
 * @param schema string
 * @param aliasIds number[]
 * @returns Promise
 */
export async function findByAliasIdsIn(
  schema: string,
  aliasIds: number[],
  userId: number | undefined,
  searchParam?: string
): Promise<IUserAlias[]> {
  logger.log('info', `Fetching alias mappings with aliasIds ${aliasIds} `);

  return await UserAlias.findByAliasIds(schema, aliasIds, userId, searchParam);
}

export async function fetchActiveAliasUserByUserId(
  schema: string,
  userId: number
) {
  logger.info('Fetching active alias users by user Id', userId);

  return await UserAlias.fetchActiveAliasUserByUserId(schema, userId);
}

export async function fetchActiveAliasUserByUserAndAliasUserIdsIn(
  schema: string,
  userId: number,
  aliasUserIds: number[]
) {
  logger.info('Fetching active alias users by user Id', userId);

  return await UserAlias.fetchActiveAliasUserByUserAndAliasUserIdsIn(
    schema,
    userId,
    aliasUserIds
  );
}

export async function fetchClientDomainsFromAliasUsers(
  schema: string,
  aliasMapping: any
) {
  logger.info(
    `Fetching client domain of user ${aliasMapping.aliasUserId} within ${aliasMapping.historicalEmailAccessStartDate} and ${aliasMapping.historicalEmailAccessEndDate}`
  );

  const clientContactDetails = await userSenderReceiverAssociationDao.findClientIdsByProviderUserFromTimeRange(
    schema,
    [aliasMapping.aliasUserId],
    aliasMapping.historicalEmailAccessStartDate,
    aliasMapping.historicalEmailAccessEndDate
  );
  return clientContactDetails;
}

/**
 * Find only one alias
 * @param schema string
 * @param query any
 * @returns Promise
 */
export async function findOne(
  schema: string,
  query: any
): Promise<IUserAlias | null> {
  logger.log(
    'info',
    'Fetching one user alias mapping by query from database',
    query
  );
  const [userAlias] = await UserAlias.find(query).withSchema(schema).limit(1);

  return userAlias;
}

/**
 * Calculate the alias end date.
 *
 * @param startDate date
 * @param defaultAliasExpiryDuration number
 * @returns date
 */
const getAliasEndDate = (
  startDate: Date,
  defaultAliasExpiryDuration: number
) => {
  const endDate = new Date(startDate);

  endDate.setDate(new Date(startDate).getDate() + defaultAliasExpiryDuration);

  return endDate;
};

/**
 * Get the aliasAccessStartDate and aliasAccessEndDate.
 *
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {String} schema
 * @param  {Boolean} isCustomAccessDurationSet
 * @returns date
 */
const getAliasAccessDate = async (
  startDate: Date,
  endDate: any,
  schema: string,
  isCustomAccessDurationSet: boolean
) => {
  const aliasAccessStartDate = startDate || new Date();

  const isAliasEndDateNotGiven =
    isCustomAccessDurationSet && aliasAccessStartDate && !endDate;

  let aliasAccessEndDate = endDate;

  if (!isCustomAccessDurationSet || isAliasEndDateNotGiven) {
    const organizationOperation = await OrganizationOperation.findFirstRecord(
      schema,
      { slug: schema }
    );

    aliasAccessEndDate = organizationOperation.isDefaultAliasExpirySet
      ? getAliasEndDate(
          aliasAccessStartDate,
          organizationOperation.defaultAliasExpiryDuration
        )
      : null;
  }

  return { aliasAccessStartDate, aliasAccessEndDate };
};

/**
 * Create new alias mapping
 * @param schema string
 * @param userAliasPayload UserAliasPayload
 * @returns {object}
 */
export async function create(
  schema: string,
  userAliasPayload: UserAliasPayload
): Promise<IUserAlias> {
  logger.log('info', 'Creating new user alias mapping', userAliasPayload);

  const {
    aliasStartDate,
    aliasEndDate,
    isCustomAccessDurationSet
  } = userAliasPayload;

  const { aliasAccessStartDate, aliasAccessEndDate } = await getAliasAccessDate(
    aliasStartDate,
    aliasEndDate,
    schema,
    isCustomAccessDurationSet
  );

  const userAliasUpdatePayload = {
    ...userAliasPayload,
    aliasStartDate: aliasAccessStartDate,
    aliasEndDate: aliasAccessEndDate
  };
  const currentDate = moment(new Date()).format(DEFAULT_DATE_TIME_FORMAT);
  const [userAlias] = await UserAlias.create(schema, {
    ...userAliasUpdatePayload,
    mapping_history: JSON.stringify([
      { ...userAliasUpdatePayload, setDate: currentDate }
    ])
  });

  return userAlias;
}

/**
 * Update alias information based on query
 * @param schema string
 * @param updateQuery any
 * @param query any
 * @returns Promise
 */
export async function update(
  schema: string,
  updateQuery: any,
  payload: any,
  mappingHistory?: any
) {
  const { aliasStartDate, aliasEndDate, isCustomAccessDurationSet } = payload;

  const { aliasAccessStartDate, aliasAccessEndDate } = await getAliasAccessDate(
    aliasStartDate,
    aliasEndDate,
    schema,
    isCustomAccessDurationSet
  );

  let updateAliasPayload = {
    ...payload,
    aliasStartDate: aliasAccessStartDate,
    aliasEndDate: aliasAccessEndDate
  };

  const currentDate = moment(new Date()).format(DEFAULT_DATE_TIME_FORMAT);

  const mapping = { ...updateAliasPayload, setDate: currentDate };
  const newMappingHistory = mappingHistory
    ? [...mappingHistory, mapping]
    : mapping;

  updateAliasPayload = {
    ...updateAliasPayload,
    mappingHistory: JSON.stringify(newMappingHistory)
  };

  return UserAlias.updateUserAlias(schema, updateQuery, {
    ...updateAliasPayload
  });
}

/**
 * Remove aliases based on query.
 *
 * @param {string} schema
 * @param {any} searchParam
 * @param {any} query
 *
 * @returns Promise
 */
export async function removeAllAliasesWithUserId(
  schema: string,
  userId: number | string
) {
  return UserAlias.updateUserAlias(
    schema,
    { userId },
    {
      isDeleted: true
    }
  );
}

/**
 *
 * @param schema string
 * @param userIds number[]
 * @param searchQuery string
 * @param maxRows number
 * @returns Promise
 */
export async function findPossibleAlias(
  schema: string,
  userIds: number[],
  searchQuery: string,
  maxRows: number
): Promise<IUserAlias[] | null> {
  logger.log(
    'info',
    'Fetching all possible alias for user with id',
    userIds.join(',')
  );

  return User.buildPossibleAliasQuery(schema, userIds, searchQuery, maxRows);
}
