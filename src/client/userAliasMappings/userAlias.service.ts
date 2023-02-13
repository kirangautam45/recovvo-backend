import _ from 'lodash';
import moment from 'moment';
import * as HttpStatus from 'http-status-codes';

import * as userDao from '../user/user.dao';
import logger from '../../core/utils/logger';
import errorMessage from '../user/user.errors';
import * as userAliasDao from './userAlias.dao';
import { isEmpty } from '../../core/utils/string';
import * as constants from './userAlias.constants';
import infoMessage from '../../client/user/user.infoMessage';
import NotFoundError from '../../core/exceptions/NotFoundError';
import { convertJsonToCSV, getCsvRow } from '../../core/utils/csv';
import BadRequestError from '../../core/exceptions/BadRequestError';
import { aliasSchema } from '../user/validators/userAlias.validator';
import { bulkAliasSchema } from '../user/validators/userAlias.validator';
import { DEFAULT_DATE_FORMAT } from '../common/constants/dateTimeConstants';
import { constructAliasAddSuccess } from '../../core/utils/responseMessage';
import * as clientDomainDao from '../../client/clientDomain/clientDomain.dao';
import { PROVIDER_DOMAIN_LIST } from '../../client/common/constants/exclusionList';

import {
  aliasMappingHeaders,
  aliasMappingDownloadHeaders,
  aliasMappingDownloadValidators
} from './validators/csv.validator';
import {
  constructAliasNotFound,
  constructSelfAliasNotAllowed,
  constructAliasAlreadyPresent
} from '../../core/utils/errorMessage';
import {
  IUserAlias,
  IRemoveAliasState
} from './interfaces/userAlias.interface';
import {
  buildUserUploadResponse,
  buildAliasAddResponse,
  buildCSVUserUploadResponse,
  buildCSVBulkAliasMappingResponse
} from '../../core/utils/buildJSONResponse';

/**
 * Validate alias emails for assigning them as alias
 * @param schema string
 * @param id number
 * @param emails string[]
 * @returns Promise
 */
export async function validateAlias(
  schema: string,
  id: number,
  emails: string[]
) {
  const user = await userDao.findOne(schema, { id });
  if (!user) {
    throw new NotFoundError(errorMessage.UserNotFound);
  }
  const userAliases = await fetchAliases(schema, Number(user.id));
  const userAliasList = userAliases ? userAliases.map((v: any) => v.email) : [];
  const emailAddresses = emails.map((email) => email.toLowerCase());

  return await Promise.all(
    emailAddresses.map(async (email) => {
      try {
        const aliasUser = await userDao.findOne(schema, { email });

        if (!aliasUser) {
          return buildUserUploadResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.UserNotFound
          );
        }

        if (email === user.email) {
          return buildUserUploadResponse(
            email,
            HttpStatus.BAD_REQUEST,
            constructSelfAliasNotAllowed()
          );
        }

        if (userAliasList.includes(aliasUser.email)) {
          return buildUserUploadResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.AliasAlreadyPresent
          );
        }

        return { email, message: infoMessage.AvailableForAlias, success: true };
      } catch (err) {
        logger.log('debug', err);
        return buildUserUploadResponse(
          email,
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage.SomethingWentWrong
        );
      }
    })
  );
}

/**
 * Find all possible aliases
 *
 * @returns User list
 */
export async function findPossibleAlias(
  schema: string,
  id: number,
  searchQuery: string,
  max: number
): Promise<IUserAlias[] | null> {
  logger.log('info', 'Fetching possible aliases for user with id', id);

  const userAliases = await userAliasDao.find(schema, {
    userId: id,
    isDeleted: false
  });

  let userIds: number[] = [];
  if (userAliases) userIds = _.map(userAliases, 'aliasUserId');

  userIds.push(id);

  return await userAliasDao.findPossibleAlias(
    schema,
    userIds,
    searchQuery,
    max
  );
}

/**
 * Add new alias mapping
 * @param schema string
 * @param userId number
 * @param aliasDetail Object
 * @returns Promise
 */
export async function addAliasMapping(
  schema: string,
  userId: number,
  aliasDetail: {
    aliasEmails: string[];
    isCustomAccessDurationSet: boolean;
    aliasStartDate: Date;
    aliasEndDate: Date;
    historicalEmailAccessStartDate: Date;
    historicalEmailAccessEndDate: Date;
  }
): Promise<any> {
  logger.log('info', 'Adding aliases for user data with id', userId);
  const total: number = aliasDetail.aliasEmails.length;
  let error = 0;
  let mapped = 0;
  const success: { email: string; status: number; message: string }[] = [];
  const failure: { email: string; status: number; message: string }[] = [];

  const user = await userDao.findOne(schema, { id: userId });

  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  const { aliasEmails, ...alias } = aliasDetail;

  const uniqueAliasEmails = [...new Set(aliasEmails)];

  await Promise.all(
    uniqueAliasEmails.map(async (email) => {
      const emailAddress = email.toLowerCase();
      const aliasError = await assignAlias(schema, userId, emailAddress, alias);
      if (!aliasError) {
        mapped++;
        const alias = await userDao.findByEmail(schema, emailAddress);
        return success.push(
          buildAliasAddResponse(
            emailAddress,
            HttpStatus.CREATED,
            constructAliasAddSuccess(emailAddress),
            alias?.fullName
          )
        );
      }
      error++;
      return failure.push(
        buildAliasAddResponse(
          emailAddress,
          HttpStatus.UNPROCESSABLE_ENTITY,
          aliasError
        )
      );
    })
  );

  return { data: { success, failure }, meta: { total, error, mapped } };
}

/**
 * Remove alias mapping
 * @param schema string
 * @param userId number
 * @param aliasEmail string
 * @returns Promise
 */
export async function removeAliasMapping(
  schema: string,
  userId: number,
  aliasEmail: string
): Promise<any> {
  logger.log('info', 'Removing aliases for user data with id', userId);
  const user = await userDao.findOne(schema, { id: userId });
  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }
  const alias = await userDao.findOne(schema, {
    email: aliasEmail.toLowerCase()
  });

  if (!alias) {
    throw new BadRequestError(errorMessage.AliasNotFound);
  }
  const userAliasMapping = await userAliasDao.findOne(schema, {
    userId: user.id,
    aliasUserId: alias.id,
    isDeleted: false
  });

  if (!userAliasMapping) {
    throw new BadRequestError(errorMessage.UserAliasNotMapped);
  }

  return await userAliasDao.update(
    schema,
    { userId: user.id, aliasUserId: alias.id },
    {
      isDeleted: true
    }
  );
}

export async function removeBulkAliasMapping(
  schema: string,
  userId: number,
  aliasData: { aliasEmails: string | string[] }
): Promise<any> {
  const aliasEmails = aliasData.aliasEmails;
  const success: Array<IRemoveAliasState> = [];
  const failure: Array<IRemoveAliasState> = [];

  for (const aliasEmail of aliasEmails) {
    if (!isEmpty(aliasEmail)) {
      try {
        await removeAliasMapping(schema, Number(userId), aliasEmail);
        success.push({ status: HttpStatus.OK, email: aliasEmail });
      } catch (error) {
        failure.push({ status: error.statusCode, email: aliasEmail });
      }
    }
  }

  return [{ success, failure }];
}

export async function removeAllAliases(
  schema: string,
  userId: number
): Promise<any> {
  await userAliasDao.removeAllAliasesWithUserId(schema, userId);
}

/**
 * Fetches list of aliases of the user
 * @param schema string
 * @param userId number
 * @returns Promise
 */
export async function fetchAliases(
  schema: string,
  userId: number,
  searchParam?: string
) {
  logger.log('info', 'Fetching  aliases for user data with id', userId);
  const user = await userDao.findOne(schema, { id: userId });
  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  const userActiveAliasMappings = await userAliasDao.find(schema, {
    userId: userId,
    isDeleted: false
  });
  const aliasIds = userActiveAliasMappings.map((val) => val.aliasUserId);

  searchParam = searchParam || '';
  return await userAliasDao.findByAliasIdsIn(
    schema,
    aliasIds,
    userId,
    searchParam
  );
}

/**
 * Update alias access date *
 * @param id number
 * @returns User list
 */
export async function updateAliasAccess(
  schema: string,
  userId: number,
  aliasDetail: {
    aliasEmail: string;
    isCustomAccessDurationSet: boolean;
    aliasStartDate: Date;
    aliasEndDate: Date;
    historicalEmailAccessStartDate: Date;
    historicalEmailAccessEndDate: Date;
  }
): Promise<any> {
  logger.log(
    'info',
    'Updating alias access date for user data with id',
    userId
  );
  const user = await userDao.findOne(schema, { id: userId });
  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }
  const alias = await userDao.findOne(schema, {
    email: aliasDetail.aliasEmail.toLowerCase()
  });

  if (!alias) {
    throw new BadRequestError(errorMessage.AliasNotFound);
  }
  const userAliasMapping = await userAliasDao.findOne(schema, {
    userId: user.id,
    aliasUserId: alias.id,
    isDeleted: false
  });

  if (!userAliasMapping) {
    throw new BadRequestError(errorMessage.UserAliasNotMapped);
  }

  return await userAliasDao.update(
    schema,
    { userId: user.id, aliasUserId: alias.id },
    {
      isCustomAccessDurationSet: aliasDetail.isCustomAccessDurationSet,
      aliasStartDate: aliasDetail.aliasStartDate,
      aliasEndDate: aliasDetail.aliasEndDate,
      historicalEmailAccessStartDate:
        aliasDetail.historicalEmailAccessStartDate,
      historicalEmailAccessEndDate: aliasDetail.historicalEmailAccessEndDate
    },
    userAliasMapping.mappingHistory
  );
}

/**
 * Assign alias to the user
 * @param schema string
 * @param userId number
 * @param aliasEmail string
 * @param isCustomAccessDurationSet boolean
 * @param aliasStartDate Date
 * @param aliasEndDate Date
 * @param historicalEmailAccessStartDate Date
 * @param historicalEmailAccessEndDate Date
 *
 * @returns void
 */
export async function assignAlias(
  schema: string,
  userId: number,
  aliasEmail: string,
  aliasDetail: {
    isCustomAccessDurationSet: boolean;
    aliasStartDate: Date;
    aliasEndDate: Date;
    historicalEmailAccessStartDate: Date;
    historicalEmailAccessEndDate: Date;
  }
) {
  if (!aliasEmail.length) {
    return;
  }

  const alias = await userDao.findOne(schema, {
    email: aliasEmail,
    isDeleted: false
  });

  if (!alias) {
    return constructAliasNotFound(aliasEmail);
  }
  if (alias.id === userId) {
    return constructSelfAliasNotAllowed();
  }

  const userAlias = await userAliasDao.findOne(schema, {
    userId,
    aliasUserId: Number(alias.id)
  });

  if (!userAlias) {
    userAliasDao.create(schema, {
      aliasUserId: Number(alias.id),
      userId,
      ...aliasDetail
    });

    return;
  }
  if (userAlias.isDeleted) {
    await userAliasDao.update(
      schema,
      { userId, aliasUserId: Number(alias.id) },
      {
        ...aliasDetail,
        isDeleted: false
      },
      userAlias.mappingHistory
    );
  }

  if (userAlias && !userAlias.isDeleted) return constructAliasAlreadyPresent();

  return;
}

/**
 * Map AliasCsv row to alias object.
 *
 * @param {object} aliasCsv
 *
 * @returns {object}
 */
const mapAliasCsvRowToAlias = (aliasCsv: any) => {
  return {
    aliasEmail: aliasCsv[aliasMappingHeaders.aliasEmail],
    aliasStartDate: aliasCsv[aliasMappingHeaders.accessStartDate] || null,
    aliasEndDate: aliasCsv[aliasMappingHeaders.accessEndDate] || null,
    historicalEmailAccessStartDate:
      aliasCsv[aliasMappingHeaders.historicalEmailAccessStartDate],
    historicalEmailAccessEndDate:
      aliasCsv[aliasMappingHeaders.historicalEmailAccessEndDate]
  };
};

const getIsCustomAccessDurationSet = (
  aliasStartDate: string,
  aliasEndDate: string
) => {
  return aliasStartDate || aliasEndDate ? true : false;
};

/**
 * Create or update alias mapping.
 *
 * @param {string} schema
 * @param {number} userId
 * @param {number} aliasUserId
 * @param {object} payload
 *
 * @returns promise
 */
export async function createOrUpdateAliasMapping(
  schema: string,
  userId: number,
  aliasUserId: number,
  payload: any
): Promise<any> {
  const userAlias = await userAliasDao.findOne(schema, {
    userId,
    aliasUserId
  });

  if (!userAlias) {
    return userAliasDao.create(schema, {
      aliasUserId,
      userId,
      ...payload
    });
  }

  return userAliasDao.update(
    schema,
    { userId, aliasUserId },
    {
      ...payload,
      isDeleted: false
    },
    userAlias.mappingHistory
  );
}

/**
 * Upload alias mapping CSV.
 *
 * @param {string} schema
 * @param {number} userId
 * @param {array} results
 *
 * @returns {Promise}
 */
export async function uploadAliasMappingCsv(
  schema: string,
  userId: number,
  results: Array<any>
): Promise<any> {
  const user = await userDao.findOne(schema, { id: userId });

  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  const uniqueCsvRows = new Set();

  await userAliasDao.update(
    schema,
    { userId },
    {
      isDeleted: true
    }
  );

  const response = await Promise.all(
    results.reverse().map(async (result: any, index: number) => {
      const csvRow: number = getCsvRow(results.length, index);
      const aliasMapping = mapAliasCsvRowToAlias(result);

      if (uniqueCsvRows.has(aliasMapping.aliasEmail)) {
        return buildCSVUserUploadResponse(
          csvRow,
          aliasMapping.aliasEmail,
          HttpStatus.BAD_REQUEST,
          errorMessage.MappingRepeatedBelow
        );
      }

      uniqueCsvRows.add(aliasMapping.aliasEmail);

      // In Csv if either of the value aliasStartDate or aliasEndDate
      // is given then isCustomAccessDurationSet is set to true;
      const isCustomAccessDurationSet = getIsCustomAccessDurationSet(
        aliasMapping.aliasStartDate,
        aliasMapping.aliasEndDate
      );

      const { error } = aliasSchema.validate({
        ...aliasMapping,
        isCustomAccessDurationSet
      });

      const { aliasEmail, ...formattedAlias } = {
        ...aliasMapping,
        isCustomAccessDurationSet
      };

      if (error) {
        return buildCSVUserUploadResponse(
          csvRow,
          aliasEmail,
          HttpStatus.BAD_REQUEST,
          error?.details[0].message || errorMessage.BadRequestDefault
        );
      }

      const alias = await userDao.findOne(schema, {
        email: aliasEmail
      });

      if (!alias) {
        return buildCSVUserUploadResponse(
          csvRow,
          aliasEmail,
          HttpStatus.BAD_REQUEST,
          constructAliasNotFound(aliasEmail)
        );
      }

      if (alias?.id === userId) {
        return buildCSVUserUploadResponse(
          csvRow,
          aliasEmail,
          HttpStatus.BAD_REQUEST,
          constructSelfAliasNotAllowed()
        );
      }

      try {
        await createOrUpdateAliasMapping(
          schema,
          Number(userId),
          Number(alias?.id),
          formattedAlias
        );
      } catch (error) {
        return buildCSVUserUploadResponse(
          csvRow,
          aliasEmail,
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage.SomethingWentWrong
        );
      }
      return buildCSVUserUploadResponse(
        csvRow,
        aliasEmail,
        HttpStatus.CREATED,
        constants.SUCCESS
      );
    })
  );

  return response.reverse();
}

/**
 * Upload bulk alias mapping CSV.
 *
 * @param {string} schema
 * @param {array} results
 *
 * @returns {Promise}
 */
export async function uploadBulkUsersAliasMappingCsv(
  schema: string,
  results: Array<any>
): Promise<any> {
  const uniqueCsvRows = new Set();

  await userAliasDao.update(schema, {}, { isDeleted: true });

  const response = await Promise.all(
    results.reverse().map(async (result: any, index: number) => {
      const csvRow: number = getCsvRow(results.length, index);
      const aliasMapping = {
        ...mapAliasCsvRowToAlias(result),
        userEmail: result['UserEmail']
      };

      const uniqueUserAliasPair = JSON.stringify({
        userEmail: aliasMapping.userEmail,
        aliasEmail: aliasMapping.aliasEmail
      });

      if (uniqueCsvRows.has(uniqueUserAliasPair)) {
        return buildCSVBulkAliasMappingResponse(
          csvRow,
          aliasMapping.userEmail,
          aliasMapping.aliasEmail,
          HttpStatus.BAD_REQUEST,
          errorMessage.MappingRepeatedBelow
        );
      }

      uniqueCsvRows.add(uniqueUserAliasPair);

      const isCustomAccessDurationSet = getIsCustomAccessDurationSet(
        aliasMapping.aliasStartDate,
        aliasMapping.aliasEndDate
      );

      const { error } = bulkAliasSchema.validate({
        ...aliasMapping,
        isCustomAccessDurationSet
      });

      const { aliasEmail, userEmail, ...formattedAlias } = {
        ...aliasMapping,
        isCustomAccessDurationSet
      };

      if (error) {
        return buildCSVBulkAliasMappingResponse(
          csvRow,
          userEmail,
          aliasEmail,
          HttpStatus.BAD_REQUEST,
          error?.details[0].message || errorMessage.BadRequestDefault
        );
      }

      const user = await userDao.findOne(schema, {
        email: userEmail
      });

      if (!user) {
        return buildCSVBulkAliasMappingResponse(
          csvRow,
          userEmail,
          aliasEmail,
          HttpStatus.BAD_REQUEST,
          errorMessage.UserNotFound
        );
      }

      const alias = await userDao.findOne(schema, {
        email: aliasEmail
      });

      if (!alias) {
        return buildCSVBulkAliasMappingResponse(
          csvRow,
          userEmail,
          aliasEmail,
          HttpStatus.BAD_REQUEST,
          constructAliasNotFound(aliasEmail)
        );
      }

      if (alias?.id === user.id) {
        return buildCSVBulkAliasMappingResponse(
          csvRow,
          userEmail,
          aliasEmail,
          HttpStatus.BAD_REQUEST,
          constructSelfAliasNotAllowed()
        );
      }

      try {
        await createOrUpdateAliasMapping(
          schema,
          Number(user.id),
          Number(alias?.id),
          formattedAlias
        );
      } catch (error) {
        return buildCSVBulkAliasMappingResponse(
          csvRow,
          userEmail,
          aliasEmail,
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage.SomethingWentWrong
        );
      }

      return buildCSVBulkAliasMappingResponse(
        csvRow,
        userEmail,
        aliasEmail,
        HttpStatus.CREATED,
        constants.SUCCESS
      );
    })
  );

  return response.reverse();
}

/**
 * Downloads csv with user and mapped aliases
 *
 * @returns string
 */
export async function downloadUserAliasCSV(schema: string): Promise<any> {
  const userAliases = await userAliasDao.find(schema, {
    isDeleted: false
  });

  const userJson = await getUserAliasMappingWithCsvHeaders(schema, userAliases);

  return convertJsonToCSV(aliasMappingDownloadValidators, userJson);
}

/**
 * Converts given set of aliases list with csv file headers as keys.
 *
 * @returns json
 */
export async function getUserAliasMappingWithCsvHeaders(
  schema: string,
  userAliases: Array<IUserAlias>
) {
  const users = await userDao.find(schema, {
    isDeleted: false
  });

  if (!users) {
    throw new NotFoundError(errorMessage.UserNotFound);
  }

  let userJson: { [key: string]: any }[] = [];

  users.map((user) => {
    const userAliasList = userAliases.filter(
      (userAlias) => user.id === userAlias.userId
    );

    userAliasList &&
      userAliasList.map((userAlias) => {
        const alias = users.find((user) => user.id === userAlias.aliasUserId);

        userJson = [
          ...userJson,
          {
            [aliasMappingDownloadHeaders.userEmail]: user?.email,
            [aliasMappingDownloadHeaders.aliasEmail]: alias?.email,
            [aliasMappingDownloadHeaders.accessStartDate]: userAlias?.aliasStartDate
              ? moment(userAlias?.aliasStartDate).format(DEFAULT_DATE_FORMAT)
              : null,
            [aliasMappingDownloadHeaders.accessEndDate]: userAlias?.aliasEndDate
              ? moment(userAlias?.aliasEndDate).format(DEFAULT_DATE_FORMAT)
              : null,
            [aliasMappingDownloadHeaders.historicalEmailAccessStartDate]: moment(
              userAlias?.historicalEmailAccessStartDate
            ).format(DEFAULT_DATE_FORMAT),
            [aliasMappingDownloadHeaders.historicalEmailAccessEndDate]: moment(
              userAlias?.historicalEmailAccessEndDate
            ).format(DEFAULT_DATE_FORMAT)
          }
        ];
      });
  });
  return userJson;
}

/**
 * Returns the associated clientDomains for userAliasMapping
 * @param schema
 * @param userId
 */
export async function findAliasClientDomainsByUserAndAliasIdsIn(
  schema: string,
  userId: number,
  aliasUserIds: number[]
): Promise<{
  clientDomainIds: number[];
  activeAliasUserIds: number[];
  aliasClientContactIds: number[];
}> {
  logger.info(
    'Fetching the client domains of mapped alias users of userId',
    userId
  );

  const activeAliasUsers = await userAliasDao.fetchActiveAliasUserByUserAndAliasUserIdsIn(
    schema,
    userId,
    aliasUserIds
  );

  const activeAliasUserIds = _.map(activeAliasUsers, 'aliasUserId');

  const aliasClientDomains: any = [];
  const aliasClientContacts: any = [];

  await Promise.all(
    activeAliasUsers.map(async (aliasUser: any) => {
      const aliasClientDomainDetails = await userAliasDao.fetchClientDomainsFromAliasUsers(
        schema,
        aliasUser
      );
      aliasClientDomains.push(
        _.compact(_.map(aliasClientDomainDetails, 'clientDomainId'))
      );
      aliasClientContacts.push(
        _.compact(_.map(aliasClientDomainDetails, 'senderReceiverUserId'))
      );
    })
  );

  const aliasClientDomainIds: number[] = _.compact(aliasClientDomains.flat());
  const aliasClientContactIds: number[] = _.compact(aliasClientContacts.flat());

  const privateClientDomains = await clientDomainDao.findByDomainsIn(
    schema,
    PROVIDER_DOMAIN_LIST
  );
  const privateClientDomainIds = _.map(privateClientDomains, 'id');
  const clientDomainIds = aliasClientDomainIds.filter(
    (domain) => !privateClientDomainIds.includes(domain)
  );

  return { clientDomainIds, activeAliasUserIds, aliasClientContactIds };
}
