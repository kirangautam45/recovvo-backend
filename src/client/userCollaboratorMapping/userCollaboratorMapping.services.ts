import moment from 'moment';
import * as HttpStatus from 'http-status-codes';

import * as UserDao from '../user/user.dao';
import logger from '../../core/utils/logger';
import errorMessage from '../user/user.errors';
import { findAccessDuration } from './userCollaboratorMapping.utils';
import * as UserCollaboratorMappingDao from './userCollaboratorMapping.dao';
import {
  constructCollaboratorNotFound,
  constructSelfCollaborationNotAllowed,
  constructUserNotFound
} from '../../core/utils/errorMessage';
import {
  buildCSVUserUploadResponse,
  buildCollaboratorAddResponse,
  buildCSVBulkCollaboratorMappingResponse
} from '../../core/utils/buildJSONResponse';
import {
  constructCollaboratorAddSuccess,
  constructCollaboratorUpdateSuccess
} from '../../core/utils/responseMessage';
import infoMessage from '../../client/user/user.infoMessage';
import NotFoundError from '../../core/exceptions/NotFoundError';
import { convertJsonToCSV, getCsvRow } from '../../core/utils/csv';
import BadRequestError from '../../core/exceptions/BadRequestError';
import AddCollaboratorPayload from './dto/collaboratorAddPayload.dto';
import ICollaboratorUser from './interfaces/UserCollaborator.interface';
import ICollaboratorsUpdatePayload from './dto/collaboratorUpdatePayload';
import FetchCollaboratorPayload from './dto/fetchCollaboratorPayload.dto';
import { DEFAULT_DATE_FORMAT } from '../common/constants/dateTimeConstants';
import {
  csvBulkMappingHeaders,
  csvHeaders
} from './validators/collaboratorMappingCsv.validator';
import { DEFAULT_DATE_TIME_FORMAT } from '../common/constants/dateTimeConstants';
import { collaboratorCSVRowSchema } from './validators/collaboratorMappingCsv.validator';
import { bulkCollaboratorMappingCSVRowSchema } from './validators/collaboratorMappingCsv.validator';
import { userCollaboratorBulkMappingCsvValidator } from '../userCollaboratorMapping/validators/collaboratorMappingCsv.validator';

/**
 * Add collaborator mapping.
 *
 * @param schema string
 * @param userId number Id of the user
 * @param addCollaboratorPayload object
 *
 * @returns Promise
 */
export async function addCollaboratorMappings(
  schema: string,
  userId: number,
  addCollaboratorPayload: AddCollaboratorPayload
): Promise<any> {
  const collaboratorEmails = addCollaboratorPayload.collaboratorEmails;
  const accessEndDate = addCollaboratorPayload.accessEndDate;
  const accessStartDate = addCollaboratorPayload.accessStartDate;
  const isCustomAccessDurationSet =
    addCollaboratorPayload.isCustomAccessDurationSet;
  const total: number = collaboratorEmails.length;
  let error = 0;
  let mapped = 0;
  const success: { email: string; status: number; message: string }[] = [];
  const failure: { email: string; status: number; message: string }[] = [];
  const user = await UserDao.findOne(schema, {
    id: userId,
    isDeleted: false
  });

  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  const userEmail = user.email;

  const uniqueCollaboratorEmails = [...new Set(collaboratorEmails)];

  await Promise.all(
    uniqueCollaboratorEmails.map(async (email) => {
      const collaborator = await UserDao.findOne(schema, {
        email,
        isDeleted: false
      });
      if (!collaborator) {
        error++;
        return failure.push(
          buildCollaboratorAddResponse(
            email,
            HttpStatus.BAD_REQUEST,
            constructUserNotFound(email)
          )
        );
      }
      const collaboratorMapping = await UserCollaboratorMappingDao.findOne(
        schema,
        {
          userId: userId,
          collaboratorId: collaborator.id,
          isDeleted: false
        }
      );
      if (collaboratorMapping) {
        error++;
        return failure.push(
          buildCollaboratorAddResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.CollaboratorAlreadyExist
          )
        );
      }
      const emailAddress = email.toLowerCase();
      const collaboratorError = await assignCollaborator({
        schema,
        userEmail,
        collaboratorEmail: emailAddress,
        isCustomAccessDurationSet,
        collaborationStartDate: accessStartDate,
        collaborationEndDate: accessEndDate
      });
      if (!collaboratorError) {
        mapped++;
        const collaborator = await UserDao.findByEmail(schema, emailAddress);
        return success.push(
          buildCollaboratorAddResponse(
            emailAddress,
            HttpStatus.CREATED,
            constructCollaboratorAddSuccess(user.email),
            collaborator?.fullName
          )
        );
      }
      error++;
      return failure.push(
        buildCollaboratorAddResponse(
          emailAddress,
          HttpStatus.UNPROCESSABLE_ENTITY,
          collaboratorError
        )
      );
    })
  );

  return { data: { success, failure }, meta: { total, error, mapped } };
}

/**
 * Validate collaborator emails for assigning them as collaborator.
 *
 * @param schema string
 * @param id number
 * @param emails string[]
 *
 * @returns Promise
 */
export async function validateCollaborator(
  schema: string,
  id: number,
  emails: string[]
) {
  const user = await UserDao.findOne(schema, { id, isActive: true });
  if (!user) {
    throw new NotFoundError(errorMessage.UserNotFound);
  }
  const userCollaborators = await fetchCollaborators(schema, Number(user.id));
  const userCollaboratorList = userCollaborators
    ? userCollaborators.map((v: any) => v.email)
    : [];
  const emailAddresses = emails.map((email) => email.toLowerCase());

  return await Promise.all(
    emailAddresses.map(async (email) => {
      try {
        const collaboratorUser = await UserDao.findOne(schema, { email });

        if (!collaboratorUser) {
          return buildCollaboratorAddResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.UserNotFound
          );
        }

        if (userCollaboratorList.includes(collaboratorUser.email)) {
          return buildCollaboratorAddResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.CollaboratorAlreadyExist
          );
        }
        if (collaboratorUser.id === id) {
          return buildCollaboratorAddResponse(
            email,
            HttpStatus.BAD_REQUEST,
            constructSelfCollaborationNotAllowed()
          );
        }
        if (!collaboratorUser.isActive) {
          return buildCollaboratorAddResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.UserNotFound
          );
        }

        return {
          email,
          message: infoMessage.AvailableForCollboarator,
          success: true
        };
      } catch (err) {
        logger.log('debug', err);
        return buildCollaboratorAddResponse(
          email,
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage.SomethingWentWrong
        );
      }
    })
  );
}

/**
 * Remove collaborator mapping.
 *
 * @param schema string
 * @param id number
 * @param collaboratorEmail string Email of collaborator
 *
 * @returns Promise
 */
export async function removeCollaboratorMapping(
  schema: string,
  userId: number,
  collaboratorEmail: string
): Promise<any> {
  const user = await UserDao.findOne(schema, { id: userId, isDeleted: false });
  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }
  const collaborator = await UserDao.findOne(schema, {
    email: collaboratorEmail.toLowerCase(),
    isDeleted: false
  });
  if (!collaborator) {
    throw new BadRequestError(errorMessage.CollaborationNotFound);
  }
  const userCollaboratorMapping = await UserCollaboratorMappingDao.findOne(
    schema,
    {
      userId: user.id,
      collaboratorId: collaborator.id,
      isDeleted: false
    }
  );

  if (!userCollaboratorMapping) {
    throw new BadRequestError(errorMessage.UserCollaboratorNotMapped);
  }

  return await UserCollaboratorMappingDao.update(
    schema,
    {
      collaboratorId: userCollaboratorMapping.collaboratorId,
      userId: userId
    },
    {
      isDeleted: true
    }
  );
}

/**
 * Remove all collaborator mappings for the given userId.
 *
 * @param schema string
 * @param userId string
 */
export async function removeAllCollaboratorMappings(
  schema: string,
  userId: number
): Promise<any> {
  await UserCollaboratorMappingDao.removeAllCollaboratorsWithUserId(
    schema,
    userId
  );
}

/**
 * Fetch collaborators of user.
 *
 * @param schema Tenant name
 * @param userId Id of user
 *
 * @returns Promise
 */
export async function fetchCollaborators(
  schema: string,
  userId: number,
  searchParam?: string
): Promise<ICollaboratorUser[] | null> {
  const user = await UserDao.findOne(schema, { id: userId, isDeleted: false });
  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }
  const activeUserCollaborationMapping = await UserCollaboratorMappingDao.find(
    schema,
    {
      userId: userId,
      isDeleted: false
    }
  );
  const collaboratorIds = activeUserCollaborationMapping.map(
    (val) => val.collaboratorId
  );

  searchParam = searchParam || '';
  return await UserCollaboratorMappingDao.findCollaborators(
    schema,
    collaboratorIds,
    userId,
    searchParam
  );
}

/**
 * Fetch all possible collaborators of the user.
 *
 * @param schema string
 * @param id number Id of user
 * @param searchQuery string
 * @param max number
 *
 * @returns Promise
 */
export async function fetchPossibleCollaborators(
  schema: string,
  id: number,
  searchQuery: string,
  max: number
): Promise<FetchCollaboratorPayload[] | undefined> {
  logger.log('info', 'Fetching possible collaborators for user with id', id);

  const existingCollaboratorOfUser = await fetchCollaborators(schema, id);
  const collaboratorIds = existingCollaboratorOfUser?.map(
    (user) => user.collaboratorId
  );
  const collaborators = await UserCollaboratorMappingDao.findPossibleCollaborator(
    schema,
    id,
    collaboratorIds || [],
    searchQuery,
    max
  );

  return collaborators?.map((collaborator) => ({
    fullName: collaborator.fullName,
    email: collaborator.email,
    id: collaborator.collaboratorId
  }));
}

/**
 * Assign collaborator to the user with given userId.
 *
 * @param schema string
 * @param collaboratorEmail string
 * @param isCustomAccessDurationSet boolean
 * @param accessStartDate date
 * @param accessEndDate date
 *
 * @returns Promise
 */
export async function assignCollaborator({
  schema,
  userEmail,
  collaboratorEmail,
  isCustomAccessDurationSet,
  collaborationStartDate,
  collaborationEndDate
}: {
  schema: string;
  collaboratorEmail: string;
  userEmail: string;
  isCustomAccessDurationSet: boolean | string;
  collaborationStartDate: Date | null;
  collaborationEndDate: Date | null;
}): Promise<any> {
  if (typeof isCustomAccessDurationSet === 'string') {
    isCustomAccessDurationSet =
      isCustomAccessDurationSet.toLowerCase() === 'true';
  }
  if (isCustomAccessDurationSet === false) {
    collaborationStartDate = null;
    collaborationEndDate = null;
  }

  const { accessStartDate, accessEndDate } = await findAccessDuration(
    schema,
    collaborationStartDate,
    collaborationEndDate
  );

  collaborationStartDate = accessStartDate;
  collaborationEndDate = accessEndDate;

  const collaborator = await UserDao.findOne(schema, {
    email: collaboratorEmail,
    isDeleted: false
  });

  if (!collaborator) {
    return constructCollaboratorNotFound(collaboratorEmail);
  }

  const collaboratorId = collaborator.id;

  const user = await UserDao.findOne(schema, {
    email: userEmail,
    isDeleted: false
  });

  if (!user) {
    return constructUserNotFound(userEmail);
  }

  const userId = user.id;

  if (collaboratorId === userId) {
    return constructSelfCollaborationNotAllowed();
  }

  try {
    await createOrUpdateCollaboratorMapping(
      schema,
      Number(userId),
      Number(collaboratorId),
      {
        isCustomAccessDurationSet,
        collaborationEndDate,
        collaborationStartDate
      }
    );
  } catch (error) {
    return errorMessage.SomethingWentWrong;
  }
}

/**
 * Create or update collaborator mapping.
 *
 * @param {string} schema
 * @param {number} userId
 * @param {number} collaboratorId
 * @param {object} payload
 *
 * @returns promise
 */
export async function createOrUpdateCollaboratorMapping(
  schema: string,
  userId: number,
  collaboratorId: number,
  payload: any
): Promise<any> {
  const userCollaborator = await UserCollaboratorMappingDao.findOne(schema, {
    userId,
    collaboratorId
  });

  const currentDate = moment(new Date()).format(DEFAULT_DATE_TIME_FORMAT);
  const mapping = { ...payload, setDate: currentDate };
  if (!userCollaborator) {
    return UserCollaboratorMappingDao.create(schema, {
      collaboratorId,
      userId,
      ...payload,
      mappingHistory: JSON.stringify(mapping)
    });
  }

  const newMappingHistory = userCollaborator.mappingHistory
    ? [...userCollaborator.mappingHistory, mapping]
    : mapping;

  return UserCollaboratorMappingDao.update(
    schema,
    { userId, collaboratorId },
    {
      ...payload,
      isDeleted: false,
      mappingHistory: JSON.stringify(newMappingHistory)
    }
  );
}

/**
 * Update user collaborators by id.
 *
 * @param schema string
 * @param userId number
 * @param updatePayload object
 *
 * @returns Promise
 */
export async function update(
  schema: string,
  userId: number,
  updatePayload: ICollaboratorsUpdatePayload
): Promise<any> {
  const collaborationStartDate = updatePayload.accessStartDate;
  const collaborationEndDate = updatePayload.accessEndDate;
  const collaboratorEmails = updatePayload.collaboratorEmails || [];
  const isCustomAccessDurationSet = updatePayload.isCustomAccessDurationSet;

  const user = await UserDao.findOne(schema, {
    id: userId,
    isDeleted: false
  });

  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  const userEmail = user.email;
  let data: Array<any> = [];

  await Promise.all(
    collaboratorEmails.map(async (collaboratorEmail) => {
      const collaborator = await UserDao.findOne(schema, {
        email: collaboratorEmail,
        isDeleted: false
      });

      if (!collaborator) {
        return (data = [
          ...data,
          buildCollaboratorAddResponse(
            collaboratorEmail,
            HttpStatus.BAD_REQUEST,
            constructUserNotFound(collaboratorEmail)
          )
        ]);
      }

      const collaboratorMapping = await UserCollaboratorMappingDao.findOne(
        schema,
        {
          userId: userId,
          collaboratorId: collaborator.id,
          isDeleted: false
        }
      );
      if (!collaboratorMapping) {
        return (data = [
          ...data,
          buildCollaboratorAddResponse(
            collaboratorEmail,
            HttpStatus.BAD_REQUEST,
            errorMessage.CollaborationNotFound
          )
        ]);
      }

      const collaboratorAssignmentError = await assignCollaborator({
        schema,
        collaboratorEmail,
        userEmail,
        isCustomAccessDurationSet,
        collaborationStartDate,
        collaborationEndDate
      });
      if (collaboratorAssignmentError) {
        return (data = [
          ...data,
          buildCollaboratorAddResponse(
            collaboratorEmail,
            HttpStatus.BAD_REQUEST,
            collaboratorAssignmentError
          )
        ]);
      }
      return (data = [
        ...data,
        buildCollaboratorAddResponse(
          collaboratorEmail,
          HttpStatus.CREATED,
          constructCollaboratorUpdateSuccess(),
          collaborator?.fullName
        )
      ]);
    })
  );

  return await data;
}

/**
 * Processes user-collaborator mapping CSV file
 *
 * @param schema string
 * @param userId number
 * @param results array
 *
 * @returns Promise
 */
export async function uploadCollaboratorsMappingCsv(
  schema: string,
  userId: number,
  results: any[]
): Promise<any> {
  await UserCollaboratorMappingDao.update(
    schema,
    { userId },
    { isDeleted: true }
  );
  const uniqueCsvRows = new Set();

  const response = await Promise.all(
    results.reverse().map(async (csvRow, index) => {
      const rowNumber = getCsvRow(results.length, index);
      const collaboratorMapping = mapCollaboratorCsvRowToCollaborator(csvRow);
      const { collaboratorEmail } = collaboratorMapping;

      if (uniqueCsvRows.has(collaboratorEmail)) {
        return buildCSVUserUploadResponse(
          rowNumber,
          collaboratorEmail,
          HttpStatus.BAD_REQUEST,
          errorMessage.MappingRepeatedBelow
        );
      }
      uniqueCsvRows.add(collaboratorEmail);

      const isCustomAccessDurationSet = getIsCustomAccessDurationSet(
        collaboratorMapping.accessStartDate,
        collaboratorMapping.accessEndDate
      );

      logger.log('info', 'Validating csv row');
      const { error } = collaboratorCSVRowSchema.validate({
        ...collaboratorMapping,
        isCustomAccessDurationSet
      });
      if (error) {
        return buildCSVUserUploadResponse(
          rowNumber,
          collaboratorEmail,
          HttpStatus.BAD_REQUEST,
          error?.details[0].message || errorMessage.BadRequestDefault
        );
      }

      const user = await UserDao.findOne(schema, {
        id: userId,
        isDeleted: false
      });
      if (!user) {
        return buildCSVUserUploadResponse(
          rowNumber,
          collaboratorEmail,
          HttpStatus.BAD_REQUEST,
          errorMessage.UserNotFound
        );
      }
      const userEmail = user.email;
      try {
        const collaboratorAssignError = await assignCollaborator({
          schema,
          userEmail,
          collaboratorEmail,
          isCustomAccessDurationSet,
          collaborationStartDate: collaboratorMapping.accessStartDate,
          collaborationEndDate: collaboratorMapping.accessEndDate
        });

        if (collaboratorAssignError) {
          return buildCSVUserUploadResponse(
            rowNumber,
            collaboratorEmail,
            HttpStatus.BAD_REQUEST,
            collaboratorAssignError
          );
        }
      } catch (error) {
        return buildCSVUserUploadResponse(
          rowNumber,
          collaboratorEmail,
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage.SomethingWentWrong
        );
      }

      return buildCSVUserUploadResponse(
        rowNumber,
        collaboratorEmail,
        HttpStatus.CREATED,
        errorMessage.CollaboratorSuccessfullyMapped
      );
    })
  );

  return response.reverse();
}

/** In Csv if either of the value collaborationStartDate or collaborationEndDate is given then isCustomAccessDurationSet is set to true; */
const getIsCustomAccessDurationSet = (
  collaborationStartDate: string,
  collaborationEndDate: string
) => {
  return collaborationStartDate || collaborationEndDate ? true : false;
};

/**
 * Processes CSV file
 *
 * @param schema string
 * @param results array
 */
export async function uploadBulkUsersCollaboratorsMappingCsv(
  schema: string,
  results: any[]
): Promise<any> {
  const uniqueRows = new Set();

  await UserCollaboratorMappingDao.update(schema, {}, { isDeleted: true });

  const response = await Promise.all(
    results.reverse().map(async (csvRow: any, index: number) => {
      const rowNumber = getCsvRow(results.length, index);
      const collaboratorMapping = {
        ...mapCollaboratorCsvRowToCollaborator(csvRow),
        userEmail: csvRow['UserEmail']
      };

      const uniqueUserCollaboratorPair = JSON.stringify({
        userEmail: results[index].UserEmail,
        collaboratorEmail: results[index].CollaboratorEmail
      });

      const isCustomAccessDurationSet = getIsCustomAccessDurationSet(
        collaboratorMapping.accessStartDate,
        collaboratorMapping.accessEndDate
      );

      const { collaboratorEmail, userEmail } = collaboratorMapping;

      if (uniqueRows.has(uniqueUserCollaboratorPair)) {
        return buildCSVBulkCollaboratorMappingResponse(
          rowNumber,
          userEmail,
          collaboratorEmail,
          HttpStatus.BAD_REQUEST,
          errorMessage.MappingRepeatedBelow
        );
      }

      uniqueRows.add(uniqueUserCollaboratorPair);

      const { error } = bulkCollaboratorMappingCSVRowSchema.validate({
        ...collaboratorMapping,
        isCustomAccessDurationSet
      });
      if (error) {
        return buildCSVBulkCollaboratorMappingResponse(
          rowNumber,
          userEmail,
          collaboratorEmail,
          HttpStatus.BAD_REQUEST,
          error?.details[0].message || errorMessage.BadRequestDefault
        );
      }

      try {
        const collaboratorAssignError = await assignCollaborator({
          schema,
          userEmail,
          collaboratorEmail,
          isCustomAccessDurationSet,
          collaborationStartDate: collaboratorMapping.accessStartDate,
          collaborationEndDate: collaboratorMapping.accessEndDate
        });

        if (collaboratorAssignError) {
          return buildCSVBulkCollaboratorMappingResponse(
            rowNumber,
            userEmail,
            collaboratorEmail,
            HttpStatus.BAD_REQUEST,
            collaboratorAssignError
          );
        }
      } catch (error) {
        return buildCSVBulkCollaboratorMappingResponse(
          rowNumber,
          userEmail,
          collaboratorEmail,
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage.SomethingWentWrong
        );
      }

      return buildCSVBulkCollaboratorMappingResponse(
        rowNumber,
        userEmail,
        collaboratorEmail,
        HttpStatus.CREATED,
        errorMessage.CollaboratorSuccessfullyMapped
      );
    })
  );

  return response.reverse();
}

/**
 * Downloads csv with user and mapped collaborators.
 *
 * @returns string
 */
export async function downloadUserCollaboratorCSV(
  schema: string
): Promise<string> {
  const userCollaboratorMappings = await UserCollaboratorMappingDao.find(
    schema,
    {
      isDeleted: false
    }
  );

  const userCollaboratorJson = await getUserCollaboratorJson(
    schema,
    userCollaboratorMappings
  );

  return convertJsonToCSV(
    userCollaboratorBulkMappingCsvValidator,
    userCollaboratorJson.sort((a, b) => (a.UserEmail <= b.UserEmail ? -1 : 1))
  );
}

/**
 * Converts collaborators to a JSON with csv file headers as keys.
 *
 * @returns json
 */
export async function getUserCollaboratorJson(
  schema: string,
  userCollaboratorMappings: Array<any>
) {
  const users = await UserDao.find(schema, {
    isDeleted: false,
    isActive: true,
    isAppUser: true
  });
  if (!users) {
    throw new NotFoundError(errorMessage.UserNotFound);
  }

  let userCollaboratorJson: { [key: string]: any }[] = [];

  users.map(async (user) => {
    const userCollaboratorList = userCollaboratorMappings.filter(
      (userCollaborator) => user.id === userCollaborator.userId
    );

    userCollaboratorList.map(async (userCollaborator) => {
      const collaborator = users.find(
        (user) => user.id === userCollaborator.collaboratorId
      );
      userCollaboratorJson = [
        ...userCollaboratorJson,
        {
          [csvBulkMappingHeaders.userEmail]: user?.email,
          [csvBulkMappingHeaders.collaboratorEmail]: collaborator?.email,
          [csvBulkMappingHeaders.accessStartDate]: moment(
            userCollaborator.collaborationStartDate
          ).format(DEFAULT_DATE_FORMAT),
          [csvBulkMappingHeaders.accessEndDate]: userCollaborator.collaborationEndDate
            ? moment(userCollaborator.collaborationEndDate).format(
                DEFAULT_DATE_FORMAT
              )
            : null // Access end date may be null indicating unlimited access
        }
      ];
    });
  });

  return userCollaboratorJson;
}

/**
 * Map Collaborator row to object.
 *
 * @param {object} collaboratorCSVRow
 *
 * @returns object
 */
const mapCollaboratorCsvRowToCollaborator = (collaboratorCSVRow: any) => {
  return {
    collaboratorEmail: collaboratorCSVRow[csvHeaders.collaboratorEmail],
    accessStartDate: collaboratorCSVRow[csvHeaders.accessStartDate] || null,
    accessEndDate: collaboratorCSVRow[csvHeaders.accessEndDate] || null
  };
};
