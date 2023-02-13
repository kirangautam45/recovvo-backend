import * as _ from 'lodash';
import * as userDao from './user.dao';
import errorMessage from './user.errors';
import * as jwt from '../../core/utils/jwt';
import * as mailService from './ses.service';
import logger from '../../core/utils/logger';
import config from '../../core/config/config';
import roleMapper from './mapper/role.mapper';
import UserPayload from './dto/userPayload.dto';
import * as HttpStatus from 'http-status-codes';
import Role from '../resources/enums/role.enum';
import IUser from './interfaces/user.interface';
import * as bcrypt from '../../core/utils/bcrypt';
import JWTPayload from '../auth/dto/jwtPayload.dto';
import { convertJsonToCSV } from '../../core/utils/csv';
import ISupervisor from './interfaces/supervisor.interface';
import UserUpdatePayload from './dto/UserUpdatePayload.dto';
import ServerError from '../../core/exceptions/ServerError';
import * as departmentDao from '../department/department.dao';
import NotFoundError from '../../core/exceptions/NotFoundError';
import * as emailTemplate from '../../core/utils/email-template';
import ForbiddenError from '../../core/exceptions/ForbiddenError';
import * as userAliasDao from '../userAliasMappings/userAlias.dao';
import BadRequestError from '../../core/exceptions/BadRequestError';
import { csvHeaders, csvValidators } from './validators/csv.validator';
import { NullErrors, notNullableParams } from './enums/nullError.enum';
import * as userSupervisorDao from '../userMappings/userSupervisor.dao';
import { constructSupervisorAddSuccess } from '../../core/utils/responseMessage';
import * as userCollaboratorDao from '../userCollaboratorMapping/userCollaboratorMapping.dao';
import * as clientDomainUserMappingService from '../clientDomain/clientDomainUserMapping.service';
import {
  buildUserUploadResponse,
  buildCSVUserUploadResponse,
  buildSupervisorAddResponse
} from '../../core/utils/buildJSONResponse';
import {
  constructUserNotFound,
  constructRoleNotValid,
  constructSupervisorNotFound,
  constructUserNotSupervisor,
  constructSelfSupervisorNotAllowed
} from '../../core/utils/errorMessage';

/**
 * Fetch All Users
 *
 * @returns Promise
 */
export async function fetchAll(
  schema: string,
  loggedInPayload: JWTPayload,
  search: string,
  pageParams: { pageSize: number; page: number },
  sortParams: { field?: string; direction?: string }[],
  filter?: any
): Promise<IUser[]> {
  if (loggedInPayload.role === roleMapper.USER) {
    throw new ForbiddenError(errorMessage.UserNotAllowed);
  }
  return await userDao.fetchPaginatedUser(
    schema,
    loggedInPayload,
    search,
    pageParams,
    sortParams,
    filter
  );
}

/**
 * Downloads csv with user and mapped supervisors
 *
 * @returns string
 */
export async function downloadUserSupervisorCSV(
  schema: string
): Promise<string> {
  const users = await userDao.find(schema, {
    isDeleted: false,
    isActive: true,
    isAppUser: true
  });
  if (!users) {
    throw new NotFoundError(errorMessage.UserNotFound);
  }
  const userSupervisors = await userSupervisorDao.find(schema, {
    isDeleted: false
  });
  const userJson: { [key: string]: any }[] = [];

  users.map((user) => {
    if (user.isAdmin) {
      return;
    }
    const userSupervisorList = userSupervisors.filter(
      (userSupervisor) => user.id === userSupervisor.userId
    );
    const role = user.isAdmin
      ? roleMapper.ADMIN
      : user.isSupervisor
      ? roleMapper.SUPERVISOR
      : roleMapper.USER;
    if (userSupervisorList.length === 0) {
      userJson.push({
        [csvHeaders.firstName]: user.firstName,
        [csvHeaders.lastName]: user.lastName,
        [csvHeaders.emailAddress]: user.email,
        [csvHeaders.userType]: role,
        [csvHeaders.supervisorEmail]: ''
      });
    } else {
      userSupervisorList.map((userSupervisor) => {
        const supervisor = users.find(
          (user) => user.id === userSupervisor.supervisorId
        );
        userJson.push({
          [csvHeaders.firstName]: user.firstName,
          [csvHeaders.lastName]: user.lastName,
          [csvHeaders.emailAddress]: user.email,
          [csvHeaders.userType]: role,
          [csvHeaders.supervisorEmail]: supervisor?.email
        });
      });
    }
  });
  return convertJsonToCSV(csvValidators, userJson);
}

/**
 * Fetch All user Email suggestions
 *
 * @returns Promise
 */
export async function fetchUserSuggestionByQuery(
  schema: string,
  searchQuery: string,
  max: number
): Promise<string[]> {
  return await userDao.fetchUserSuggestionByQuery(schema, searchQuery, max);
}

/**
 * Processes CSV file
 *
 * @param loggedInUser object
 * @param filePath string
 */
export async function processCSV(
  schema: string,
  loggedInUserId: number,
  results: any[]
) {
  try {
    await userDao.update(
      schema,
      { isAdmin: false },
      { isActive: false, isSupervisor: false, isSuppressed: false }
    );
    await userSupervisorDao.update(schema, {}, { isDeleted: true });
    const supervisorEmails = _.map(results, csvHeaders.supervisorEmail);
    const supervisors = await userDao.findByEmailWhereIn(schema, {}, [
      ...new Set(supervisorEmails)
    ]);
    const uploadedSupervisorEmails: string[] = [];

    const response = await Promise.all(
      results.map(async (result, index) => {
        try {
          return await uploadUsers(
            schema,
            supervisors,
            loggedInUserId,
            result,
            index + 2,
            uploadedSupervisorEmails
          );
        } catch (err) {
          logger.log('debug', err);
          const message =
            err.name === errorMessage.MessageRejected
              ? errorMessage.EmailNotSent
              : errorMessage.SomethingWentWrong;
          return buildCSVUserUploadResponse(
            index + 2,
            result[csvHeaders.emailAddress],
            HttpStatus.INTERNAL_SERVER_ERROR,
            message
          );
        }
      })
    );
    const uploadedEmails = _.map(response, 'email');
    await createAndSendInvitationToSupervisor(
      schema,
      [...new Set(uploadedSupervisorEmails)],
      [...new Set(uploadedEmails)]
    );
    return response;
  } catch (err) {
    logger.log('debug', err);
    throw new ServerError(errorMessage.SomethingWentWrong);
  }
}

/**
 * Uploads users
 *
 * @param csvRow
 */
export async function uploadUsers(
  schema: string,
  supervisors: IUser[],
  loggedInUserId: number,
  csvRow: any,
  index: number,
  uploadedSupervisorEmails: string[]
) {
  const emailAddress: string = csvRow[csvHeaders.emailAddress].toLowerCase();
  const firstName: string = csvRow[csvHeaders.firstName];
  const lastName: string = csvRow[csvHeaders.lastName];
  const userType: string = csvRow[csvHeaders.userType];
  const supervisorEmail: string = csvRow[csvHeaders.supervisorEmail];

  const notNullError = await areFieldsEmpty(
    emailAddress,
    firstName,
    lastName,
    userType
  );
  if (notNullError) {
    return buildCSVUserUploadResponse(
      index,
      emailAddress,
      HttpStatus.BAD_REQUEST,
      notNullError
    );
  }

  const user = await userDao.findOne(schema, {
    email: emailAddress,
    isDeleted: false
  });
  if (!user) {
    return buildCSVUserUploadResponse(
      index,
      emailAddress,
      HttpStatus.BAD_REQUEST,
      constructUserNotFound(emailAddress)
    );
  }

  const role = roleMapper[userType.toUpperCase()];
  if (!role) {
    return buildCSVUserUploadResponse(
      index,
      emailAddress,
      HttpStatus.BAD_REQUEST,
      constructRoleNotValid(userType)
    );
  }
  if (user.isAdmin || role === roleMapper.ADMIN) {
    return buildCSVUserUploadResponse(
      index,
      emailAddress,
      HttpStatus.OK,
      'success'
    );
  }

  const isSupervisor = role === roleMapper.SUPERVISOR;
  const invitationRole = isSupervisor ? roleMapper.SUPERVISOR : roleMapper.USER;

  const supervisorError = await findAndAssignSupervisor(
    schema,
    supervisors,
    supervisorEmail,
    Number(user.id)
  );
  if (supervisorError) {
    return buildCSVUserUploadResponse(
      index,
      emailAddress,
      HttpStatus.BAD_REQUEST,
      supervisorError
    );
  }

  uploadedSupervisorEmails.push(supervisorEmail);

  const updateParams: { [key: string]: any } = {
    isActive: true,
    isAppUser: true
  };

  if (!user.isActive || !user.hasSignedUp) {
    await sendEmail(schema, invitationRole, user);
    updateParams.invitedById = loggedInUserId;
  }

  if (user.firstName.length === 0) {
    updateParams.firstName = firstName;
  }

  if (user.lastName.length === 0) {
    updateParams.lastName = lastName;
  }

  if (isSupervisor) {
    updateParams.isSupervisor = isSupervisor;
  }

  await userDao.update(schema, { id: Number(user.id) }, updateParams);

  return buildCSVUserUploadResponse(
    index,
    emailAddress,
    HttpStatus.OK,
    'success'
  );
}

/**
 * Creates and sends invitation to supervisor
 *
 * @param supervisorEmails string[]
 * @param emails string[]
 */
export async function createAndSendInvitationToSupervisor(
  schema: string,
  supervisorEmails: string[],
  emails: string[]
) {
  await userDao.updateByEmailWhereIn(schema, supervisorEmails, {
    isAppUser: true,
    isActive: true,
    isSupervisor: true
  });

  const toBeInvitedEmails = supervisorEmails.filter((x) => !emails.includes(x));
  const toBeInvitedSupervisors = await userDao.findByEmailWhereIn(
    schema,
    { isDeleted: false },
    toBeInvitedEmails
  );

  return toBeInvitedSupervisors.map(async (toBeInvitedSupervisor) => {
    return await sendEmail(
      schema,
      roleMapper.SUPERVISOR,
      toBeInvitedSupervisor
    );
  });
}

/**
 * Finds and assigns supervisor
 *
 * @param supervisors object[]
 * @param supervisorEmail string
 * @param userId number
 * @param role string
 */
export async function findAndAssignSupervisor(
  schema: string,
  supervisors: IUser[],
  supervisorEmail: string,
  userId: number
) {
  if (!supervisorEmail.length) {
    return;
  }
  const supervisor = supervisors.find(
    (supervisorElem) => supervisorElem.email === supervisorEmail
  );
  if (!supervisor) {
    return constructSupervisorNotFound(supervisorEmail);
  }
  if (supervisor.id === userId) {
    return constructSelfSupervisorNotAllowed();
  }

  const userSupervisor = await userSupervisorDao.findOne(schema, {
    userId,
    supervisorId: Number(supervisor.id)
  });

  if (!userSupervisor) {
    userSupervisorDao.create(schema, {
      supervisorId: Number(supervisor.id),
      userId
    });
    return;
  }
  if (userSupervisor.isDeleted) {
    await userSupervisorDao.update(
      schema,
      { id: Number(userSupervisor.id) },
      {
        isDeleted: false
      }
    );
  }
  return;
}

/**
 * Sends email invitation to admin
 *
 * @param email string
 */
export async function sendEmailInvitation(schema: string, email: string) {
  try {
    const appUser = await userDao.findOne(schema, { email });
    if (!appUser) {
      logger.log('debug', errorMessage.UserNotFound);
      return;
    }
    await userDao.update(
      schema,
      { id: Number(appUser.id) },
      { isActive: true, isAppUser: true, isAdmin: true }
    );
    return await sendEmail(
      schema,
      roleMapper.ADMIN,
      appUser,
      config.mail.salesEmail
    );
  } catch (err) {
    logger.log('debug', err);
    return;
  }
}

/**
 * Sends email to user
 *
 * @param user IUser
 */
export async function sendEmail(
  schema: string,
  role: string,
  user: any,
  ccAddress?: string
) {
  const invitationToken = jwt.generateInvitationToken({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role
  });

  const buff = Buffer.from(schema);
  const base64EncodedSchema = buff.toString('base64');

  const {
    emailSubject,
    emailMessage
  } = emailTemplate.generateInvitationEmailMessageTemplate(
    role,
    config.mail.redirectionUrl + base64EncodedSchema + '/' + invitationToken
  );

  return await mailService.sendMessage(
    user.email,
    emailSubject,
    emailMessage,
    ccAddress
  );
}

/**
 *
 * @param index number
 * @param email string
 * @param firstName string
 * @param lastName string
 * @param userType string
 */
export function areFieldsEmpty(
  emailAddress: string,
  firstName: string,
  lastName: string,
  userType: string
) {
  const data: any = { emailAddress, firstName, lastName, userType };

  for (const csvHeader of notNullableParams) {
    if (data[csvHeader].length === 0) {
      return NullErrors[csvHeader];
    }
  }
  return;
}

/**
 * Assign supervisor
 *
 * @param supervisorEmail
 */
export async function assignSupervisor(
  schema: string,
  supervisorEmail: string,
  userId: number
) {
  if (!supervisorEmail.length) {
    return;
  }

  const supervisor = await userDao.findOne(schema, {
    email: supervisorEmail,
    isDeleted: false
  });
  if (!supervisor) {
    return constructSupervisorNotFound(supervisorEmail);
  }
  if (supervisor.id === userId) {
    return constructSelfSupervisorNotAllowed();
  }
  if (!supervisor.isSupervisor) {
    return constructUserNotSupervisor(supervisorEmail);
  }

  const userSupervisor = await userSupervisorDao.findOne(schema, {
    userId,
    supervisorId: Number(supervisor.id)
  });

  if (!userSupervisor) {
    userSupervisorDao.create(schema, {
      supervisorId: Number(supervisor.id),
      userId
    });
    return;
  }
  if (userSupervisor.isDeleted) {
    await userSupervisorDao.update(
      schema,
      { id: Number(userSupervisor.id) },
      {
        isDeleted: false
      }
    );
  }
  return;
}

/**
 * Find user by email.
 *
 * @param email string
 * @returns Promise
 */
export async function findByEmail(
  schema: string,
  email: string
): Promise<IUser | null> {
  return await userDao.findOne(schema, { email });
}

/**
 * Activate users.
 *
 * @param loggedInUserId number
 * @param emails string
 */
export async function activateUsers(
  schema: string,
  loggedInUserId: number,
  emails: string[]
) {
  const total: number = emails.length;
  let error = 0;
  let activated = 0;
  const emailAddresses = emails.map((email) => email.toLowerCase());
  const data = await Promise.all(
    emailAddresses.map(async (email) => {
      try {
        const appUser = await userDao.findOne(schema, { email });
        if (!appUser) {
          error++;
          return buildUserUploadResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.UserNotFound
          );
        }

        if (appUser.isActive && appUser.hasSignedUp) {
          error++;
          return buildUserUploadResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.UserAlreadyActivated
          );
        }

        await userDao.update(
          schema,
          { id: Number(appUser.id) },
          { isActive: true, isAppUser: true, invitedById: loggedInUserId }
        );
        await sendEmail(schema, roleMapper.USER, appUser);

        activated++;

        return { email, status: HttpStatus.CREATED };
      } catch (err) {
        error++;
        logger.log('debug', err);
        const message =
          err.name === errorMessage.MessageRejected
            ? errorMessage.EmailNotSent
            : errorMessage.SomethingWentWrong;
        return buildUserUploadResponse(
          email,
          HttpStatus.INTERNAL_SERVER_ERROR,
          message
        );
      }
    })
  );
  return { data, meta: { total, error, activated } };
}

/**
 * Validate company Users.
 *
 * @param emails string
 */
export async function validateUsers(schema: string, emails: string[]) {
  const emailAddresses = emails.map((email) => email.toLowerCase());
  return await Promise.all(
    emailAddresses.map(async (email) => {
      try {
        const appUser = await userDao.findOne(schema, { email });

        if (!appUser) {
          return buildUserUploadResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.UserNotFound
          );
        } else if (appUser.isActive && appUser.hasSignedUp) {
          return buildUserUploadResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.UserAlreadyActivated
          );
        } else {
          return { email, success: true };
        }
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
 * Verify email invitation
 *
 * @param headers object[]
 */
export async function verifyEmailInvitation(schema: string, headers: any) {
  try {
    const invitationToken = headers['invitation-token'];
    if (invitationToken) {
      const { data } = await jwt.verifyInvitationToken(invitationToken);
      const { email } = data;
      await userDao.update(schema, { email }, { isVerified: true });

      return data;
    }
    throw new BadRequestError(errorMessage.InvitationTokenNotFound);
  } catch (err) {
    logger.log('debug', err);
    if (err.name && err.name === errorMessage.TokenExpired) {
      throw new BadRequestError(errorMessage.InvitationTokenExpired);
    } else {
      throw new ServerError(errorMessage.SomethingWentWrong);
    }
  }
}

/**
 * Insert user from given user payload
 *
 * @param {UserPayload} userPayload
 * @returns {Promise<IUser>}
 */
export async function insert(
  schema: string,
  userPayload: UserPayload
): Promise<IUser> {
  logger.log('info', 'Inserting user into database:', userPayload);
  logger.log('info', 'Check existing email into database:', userPayload);

  const existingUser = await findByEmail(schema, userPayload.email);

  logger.log('info', 'does user exisit in database', existingUser);

  if (existingUser && existingUser.id) {
    throw new BadRequestError('User Exist');
  }

  const password = await bcrypt.hash(userPayload.password);
  const user = {
    ...userPayload,
    password,
    roleId: Role.NORMAL_USER
  };
  const userInfo: IUser = <IUser>await userDao.create(schema, user);
  logger.log('info', 'user created', userInfo);
  // delete userInfo.password;

  return userInfo;
}

/**
 * Update user by id.
 *
 * @param id number
 * @param updateInformation obj
 * @returns Promise
 */
export async function update(
  schema: string,
  id: number,
  updateInformation: UserUpdatePayload
) {
  if (!Object.keys(updateInformation).length) {
    throw new BadRequestError(errorMessage.UpdateInformationEmpty);
  }

  logger.log('info', 'Fetching user data by id', id);
  const appUser = await userDao.findById(schema, id);
  if (!appUser) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }
  const {
    firstName,
    lastName,
    phoneNumbers,
    department,
    middleName,
    role
  } = updateInformation;

  const updateParams: any = {};
  if (firstName) {
    updateParams.firstName = firstName;
  }

  if ('middleName' in updateInformation) {
    updateParams.middleName = middleName;
  }

  if (lastName) {
    updateParams.lastName = lastName;
  }

  if (department) {
    const departmentElem = await departmentDao.findOne(schema, {
      departmentKey: department
    });
    if (!departmentElem) {
      throw new BadRequestError(errorMessage.DepartmentNotFound);
    }
    updateParams.departmentId = departmentElem.id;
  }

  if (phoneNumbers) {
    const numbers = JSON.stringify(phoneNumbers);
    updateParams.phoneNumbers = numbers;
  }

  if (role) {
    const validRole = roleMapper[role.toUpperCase()];
    if (!validRole || validRole === roleMapper.ADMIN) {
      throw new BadRequestError(constructRoleNotValid(validRole));
    }
    const isSupervisor = validRole === roleMapper.SUPERVISOR;
    updateParams.isSupervisor = isSupervisor;
  }
  await userDao.updateById(schema, id, updateParams);
  if (appUser.isSupervisor && !updateParams.isSupervisor) {
    await userSupervisorDao.update(
      schema,
      { supervisorId: appUser.id },
      { isDeleted: true }
    );
  }

  return await userDao.findById(schema, id);
}

/**
 * Find user by id.
 *
 * @param id number
 * @returns Promise
 */
export async function findById(
  schema: string,
  id: number
): Promise<IUser | null> {
  logger.log('info', 'Fetching user data by id', id);
  return await userDao.findById(schema, id);
}

/**
 * Gets personal contact search params (subordinates, collaborator, aliases).
 *
 * @param {string} schema
 * @param {number} id
 * @param {string} searchQueryParam
 * @returns Promise
 */
export async function getPersonalContactSearchParams(
  schema: string,
  id: number,
  searchQuery: string
): Promise<any | null> {
  logger.log('info', 'Fetching possible search params for user with id', id);

  const users = await userDao.fetchAll(schema);
  const user = users?.find((item) => item.id === id);

  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  const [subordinatesResponses, subordinateCount] = await Promise.all([
    userSupervisorDao.fetchSubordinatesWithSearchParams(
      schema,
      id,
      searchQuery
    ),
    userSupervisorDao.getTotalCountOfSubordinates(schema, id)
  ]);

  const [collaboratorsResponses, collaboratorTotalCount] = await Promise.all([
    userCollaboratorDao.findByUserIdWithSearchParams(schema, id, searchQuery),
    userCollaboratorDao.getTotalCountOfCollaborators(schema, id)
  ]);

  const [aliasesResponse, aliasesTotalCount] = await Promise.all([
    userAliasDao.findByUserIdWithSearchParams(schema, id, searchQuery),
    userAliasDao.getTotalCountOfUserAliases(schema, id)
  ]);

  const aliases = aliasesResponse
    ? aliasesResponse.map((alias: any) => mapUserToJson(alias, 'aliasUserId'))
    : [];
  const collaborators = collaboratorsResponses
    ? collaboratorsResponses.map((collaborator: any) =>
        mapUserToJson(collaborator, 'collaboratorId')
      )
    : [];
  const subordinates = subordinatesResponses
    ? subordinatesResponses.map((subordinate: any) =>
        mapUserToJson(subordinate, 'userId')
      )
    : [];

  return {
    subordinateCount: subordinateCount[0].totalCount, // Total count of subordinates regardless the filter applied
    subordinates,
    collaboratorCount: collaboratorTotalCount[0].totalCount,
    collaborators,
    aliasCount: aliasesTotalCount[0].totalCount,
    aliases
  };
}

/**
 * Fetches id, email and full name of an user.
 *
 * @param user any
 * @param {String} field
 * @returns {object} {id, email, fullName}
 */
export function mapUserToJson(user: any | null, field: string) {
  return {
    id: user[field],
    email: user.email,
    fullName: user.fullName
  };
}

/**
 * Map domains to User.
 *
 * @param id number
 * @param domainUrls string[]
 * @returns Promise
 */
export async function mapDomains(
  schema: string,
  userId: number,
  domainUrls: string[]
) {
  const user = await userDao.findById(schema, userId);

  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  const response = clientDomainUserMappingService.mapDomainsToUser(
    schema,
    userId,
    domainUrls
  );

  return response;
}

/**
 * Unmap domain from a User.
 *
 * @param id number
 * @param domainId number
 */
export async function unmapDomain(
  schema: string,
  userId: number,
  domainId: number
) {
  const user = await userDao.findById(schema, userId);

  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  const response = clientDomainUserMappingService.unmapDomainFromUser(
    schema,
    userId,
    domainId
  );

  return response;
}

/**
 * Search mapped domains of a user.
 *
 * @param id number
 * @param query any
 */
export async function fetchUserClientDomains(
  schema: string,
  id: number,
  query: any
) {
  const user = await userDao.findById(schema, id);

  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  const response = clientDomainUserMappingService.fetchDomainsOfUser(
    schema,
    id,
    query
  );

  return response;
}

/** Find all supervisors
 * Find user by id.
 *
 * @param id number
 * @returns Promise
 */
export async function findAppUserById(
  schema: string,
  loggedInPayload: JWTPayload,
  id: number
): Promise<IUser | null> {
  const userSupervisor = await userSupervisorDao.findOne(schema, {
    userId: id,
    supervisorId: loggedInPayload.userId,
    isDeleted: false
  });
  const allowCondition =
    loggedInPayload.role === roleMapper.ADMIN ||
    loggedInPayload.userId === id ||
    (loggedInPayload.role === roleMapper.SUPERVISOR && userSupervisor);

  if (!allowCondition) {
    throw new ForbiddenError(errorMessage.UserNotAllowed);
  }

  logger.log('info', 'Fetching user data by id', id);
  const user = await userDao.findAppUserById(schema, id);

  if (!user) {
    throw new NotFoundError(errorMessage.UserNotFound);
  }

  return user;
}

export async function fetchUserProfile(
  schema: string,
  loggedInPayload: JWTPayload
): Promise<IUser | null> {
  logger.info('Fetching user data for user with id', loggedInPayload.userId);
  const user = await userDao.findAppUserById(
    schema,
    Number(loggedInPayload.userId)
  );
  if (!user || !user.isActive) {
    throw new NotFoundError(errorMessage.UserNotFound);
  }

  return user;
}
/**
 * Validate company supervisor.
 *
 * @param emails string
 */
export async function validateSupervisor(
  schema: string,
  id: number,
  emails: string[]
) {
  const user = await userDao.findOne(schema, { id });
  if (!user) {
    throw new NotFoundError(errorMessage.UserNotFound);
  }
  const userSupervisors = await fetchSupervisors(schema, Number(user.id));
  const userSupervisorList = userSupervisors
    ? userSupervisors.map((v: any) => v.email)
    : [];
  const emailAddresses = emails.map((email) => email.toLowerCase());

  return await Promise.all(
    emailAddresses.map(async (email) => {
      try {
        const supervisorUser = await userDao.findOne(schema, { email });

        if (!supervisorUser) {
          return buildUserUploadResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.UserNotFound
          );
        } else if (!supervisorUser.isSupervisor) {
          return buildUserUploadResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.UserNotSupervisor
          );
        } else if (userSupervisorList.includes(supervisorUser.email)) {
          return buildUserUploadResponse(
            email,
            HttpStatus.BAD_REQUEST,
            errorMessage.SupervisorAlreadyPresent
          );
        } else {
          return { email, success: true };
        }
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
 * Find all supervisors
 *
 * @param id number
 * @returns User list
 */
export async function findPossibleSupervisor(
  schema: string,
  id: number,
  searchQuery: string,
  max: number
): Promise<ISupervisor[] | null> {
  logger.log('info', 'Fetching possible supervisors for user with id', id);

  const userSupervisors = await userSupervisorDao.find(schema, {
    userId: id,
    isDeleted: false
  });

  let userIds: number[] = [];
  if (userSupervisors) userIds = _.map(userSupervisors, 'supervisorId');
  userIds.push(id);

  return await userDao.findPossibleSupervisor(
    schema,
    userIds,
    searchQuery,
    max
  );
}

/**
 * Find recommended supervisors
 *
 * @param id number
 * @returns User list
 */
export async function fetchRecommendedSupervisors(
  schema: string,
  id: number,
  searchQuery: string,
  max: number
) {
  logger.log(
    'info',
    'Fetching recommended supervisors for user data with id',
    id
  );
  // TODO: Recommend supervisors according to mapped domains
  // i.e, Supervisor of another user whose is mapped to same client domains
  // Currently returns all possivle supervisors

  const userSupervisors = await userSupervisorDao.find(schema, {
    userId: id,
    isDeleted: false
  });

  let userIds: number[] = [];
  if (userSupervisors) userIds = _.map(userSupervisors, 'supervisorId');
  userIds.push(id);

  return await userDao.findPossibleSupervisor(
    schema,
    userIds,
    searchQuery,
    max
  );
}

/**
 * Find all supervisors
 *
 * @param id number
 * @returns User list
 */
export async function addSupervisorMapping(
  schema: string,
  userId: number,
  supervisorEmails: string[]
): Promise<any> {
  const total: number = supervisorEmails.length;
  let error = 0;
  let mapped = 0;
  const success: { email: string; status: number; message: string }[] = [];
  const failure: { email: string; status: number; message: string }[] = [];

  const user = await userDao.findOne(schema, { id: userId });

  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  const uniqueSupervisorEmails = [...new Set(supervisorEmails)];

  await Promise.all(
    uniqueSupervisorEmails.map(async (email) => {
      const emailAddress = email.toLowerCase();
      const supervisorError = await assignSupervisor(
        schema,
        emailAddress,
        userId
      );
      if (!supervisorError) {
        mapped++;
        const supervisor = await userDao.findByEmail(schema, emailAddress);
        return success.push(
          buildSupervisorAddResponse(
            emailAddress,
            HttpStatus.CREATED,
            constructSupervisorAddSuccess(emailAddress),
            supervisor?.fullName
          )
        );
      }
      error++;
      return failure.push(
        buildSupervisorAddResponse(
          emailAddress,
          HttpStatus.UNPROCESSABLE_ENTITY,
          supervisorError
        )
      );
    })
  );

  return { data: { success, failure }, meta: { total, error, mapped } };
}

/**
 * Find all supervisors
 *
 * @param id number
 * @returns User list
 */
export async function removeSupervisorMapping(
  schema: string,
  userId: number,
  supervisorEmail: string
): Promise<any> {
  const user = await userDao.findOne(schema, { id: userId });
  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }
  const supervisor = await userDao.findOne(schema, {
    email: supervisorEmail.toLowerCase()
  });
  if (!supervisor) {
    throw new BadRequestError(errorMessage.SupervisorNotFound);
  }
  const userSupervisorMapping = await userSupervisorDao.findOne(schema, {
    userId: user.id,
    supervisorId: supervisor.id,
    isDeleted: false
  });

  if (!userSupervisorMapping) {
    throw new BadRequestError(errorMessage.UserSupervisorNotMapped);
  }

  return await userSupervisorDao.update(
    schema,
    { id: userSupervisorMapping.id },
    {
      isDeleted: true
    }
  );
}

/**
 * Fetch supervisors of user
 */
export async function fetchSupervisors(schema: string, userId: number) {
  const user = await userDao.findOne(schema, { id: userId });
  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  const userActiveSupervisorMappings = await userSupervisorDao.find(schema, {
    userId: userId,
    isDeleted: false
  });
  const supervisorIds = userActiveSupervisorMappings.map(
    (val) => val.supervisorId
  );

  return await userDao.findByIds(schema, supervisorIds);
}

/** Resends invitation link to user
 *
 * @param id number
 * @returns IUser
 */
export async function resendInvitationToUser(
  schema: string,
  id: number
): Promise<IUser> {
  const user = await userDao.findOne(schema, { id: id });
  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  if (user.hasSignedUp) {
    throw new BadRequestError(errorMessage.ResendInvitationNotRequired);
  }
  const userRole = user.isSupervisor ? roleMapper.SUPERVISOR : roleMapper.USER;

  await sendEmail(schema, userRole, user);

  return user;
}
