import * as _ from 'lodash';

import { SEARCH_PARAMS, SECONDARY_SEARCH } from './filter/contact.filter';
import {
  paginateData,
  getPageParams,
  getSortParams
} from '../../core/utils/recovoUtils';
import * as contactDao from './contact.dao';
import errorMessage from './contact.errors';
import logger from '../../core/utils/logger';
import Event from '../common/enums/event.enum';
import IContact from './interfaces/contact.interface';
import { DEFAULT_SORT_FIELD, ALL } from './contact.constant';
import * as mixPanelService from '../../core/utils/mixpanel';
import { ContactFields } from './validators/update.validator';
import roleMapper from '../../client/user/mapper/role.mapper';
import BadRequestError from '../../core/exceptions/BadRequestError';

import * as userAliasDao from '../userAliasMappings/userAlias.dao';
import * as userSupervisorDao from '../userMappings/userSupervisor.dao';
import * as userAliasService from '../userAliasMappings/userAlias.service';
import * as clientDomainUserMappingDao from '../clientDomain/clientDomainUserMapping.dao';
import * as userCollaboratorDao from '../userCollaboratorMapping/userCollaboratorMapping.dao';
import IVisibleProvidersInfo from '../../client/messagePart/interfaces/visibleProvidersInfo.interface';
import * as userSenderReceiverAssociationDao from '../userSenderReceiverAssociation/userSenderReceiverAssociation.dao';

/**
 * Fetch list of contacts with filtered query.
 *
 * @returns Promise
 */

export async function fetchAll(
  loggedInEmail: string,
  schema: string,
  visibleProvidersInfos: {
    data: IVisibleProvidersInfo[];
    contactId: number;
  }[],
  query?: any
): Promise<any> {
  const filter = _.pick(query, SEARCH_PARAMS);
  const sortParams = getSortParams(query, DEFAULT_SORT_FIELD);
  mixPanelService.trackEvent(
    Event.DOWNLOAD_CONTACT_CSV,
    loggedInEmail,
    JSON.stringify(query)
  );

  const contacts = await contactDao.fetchContactsWithFilter(
    schema,
    sortParams,
    visibleProvidersInfos,
    filter
  );

  return contacts.queryBuilder;
}

/**
 * Fetch list of filtered contacts with paginated data.
 *
 * @param loggedInEmail string Logged in user email
 * @param schema string
 * @param visibleProvidersInfos object
 * @param query any
 */
export async function fetchAllWithFilterAndPage(
  loggedInEmail: string,
  schema: string,
  visibleProvidersInfos: {
    data: IVisibleProvidersInfo[];
    contactId: number;
  }[],
  query?: any
) {
  const pageParams = getPageParams(query);
  const filter = _.pick(query, [...SEARCH_PARAMS, SECONDARY_SEARCH]);
  const sortParams = getSortParams(query, DEFAULT_SORT_FIELD);
  mixPanelService.trackEvent(
    Event.SEARCH_CONTACTS,
    loggedInEmail,
    JSON.stringify(query)
  );
  const contacts = await getContacts(
    schema,
    pageParams,
    sortParams,
    visibleProvidersInfos,
    filter
  );

  const totalContact = await contactDao.fetchTotalContactsWithFilter(
    schema,
    filter
  );

  return paginateData(contacts, pageParams, totalContact.count);
}

/**
 * Get contacts.
 *
 * @param pageParams
 * @param sortParams
 * @param filter
 */
async function getContacts(
  schema: string,
  pageParams: { pageSize: number; page: number },
  sortParams: { field: string; direction: string },
  visibleProvidersInfos: {
    data: IVisibleProvidersInfo[];
    contactId: number;
  }[],
  filter?: any
) {
  const contacts = await contactDao.fetchContactsWithFilterAndPage(
    schema,
    pageParams,
    sortParams,
    visibleProvidersInfos,
    filter
  );

  return contacts;
}

/**
 * Recursive function to find the supervisor's user ids
 * @param schema string
 * @param supervisorIds array of the user who is a supervisor
 * @param userIds array to store the user ids
 */
// async function getSupervisorsUserIds(
//   schema: string,
//   supervisorIds: number[],
//   userIds: any
// ): Promise<number[]> {
//   // Exit condition
//   // 1. No supervisorIds
//   // 2. All the supervisorIds are already present in userIds array (circular supervision)
//   if (supervisorIds.length == 0) return userIds;

//   const supervisors = await userSupervisorDao.findBySupervisorIdsIn(
//     schema,
//     supervisorIds
//   );

//   if (!supervisors) return userIds;

//   const supervisorUserIds = _.map(supervisors, 'userId');
//   const supervisorSupervisorIds = _.map(supervisors, 'supervisorId');

//   userIds.push(...supervisorUserIds);

//   userIds = [...new Set(userIds)];

//   if (supervisorSupervisorIds.some((v) => userIds.includes(v))) return userIds;

//   return getSupervisorsUserIds(schema, supervisorUserIds, userIds);
// }

export async function getUserSubordinateIds(schema: string, loggedInUser: any) {
  // Code to get userIds for supervisor's subordinates ids through various nests
  // userIds = await getSupervisorsUserIds(
  //   schema,
  //   [loggedInUser.userId],
  //   userIds
  // );
  const userSupervisors = await userSupervisorDao.find(schema, {
    supervisorId: loggedInUser.userId,
    isDeleted: false
  });
  if (userSupervisors) return _.map(userSupervisors, 'userId');

  return [];
}

/**
 * Returns the subordinate domains and client ids.
 *
 * @param {String} schema
 * @param {any} loggedInUser
 * @param {any} searchUserParams
 * @returns
 */
export async function getSubordinateDomainAndContactIds(
  schema: string,
  loggedInUser: any,
  searchUserParams: any
) {
  // subordinates
  let supervisorUserClientDomain: any = [];
  let subordinateClientDomainIds: any = [];
  let subordinateClientContactIds: any = [];
  let supervisorUserIds: any = [];

  if (
    searchUserParams?.subordinates?.length > 0 ||
    searchUserParams.subordnates === ALL
  ) {
    const allSupervisorUserIds = await getUserSubordinateIds(
      schema,
      loggedInUser
    );
    // For domain mapping
    supervisorUserIds =
      searchUserParams.subordinates === ALL
        ? allSupervisorUserIds
        : _.intersection(allSupervisorUserIds, searchUserParams.subordinates);
    // For continuous Email Access
    if (supervisorUserIds) {
      supervisorUserClientDomain = await userSenderReceiverAssociationDao.findClientIdsByProviderUserFromTimeRange(
        schema,
        supervisorUserIds.flat()
      );

      subordinateClientDomainIds = _.compact(
        _.map(supervisorUserClientDomain, 'clientDomainId')
      );
      subordinateClientContactIds = _.compact(
        _.map(supervisorUserClientDomain, 'senderReceiverUserId')
      );
    }
  }

  return {
    subordinateIds: supervisorUserIds,
    subordinateClientDomainIds,
    subordinateClientContactIds
  };
}
/**
 * Returs collaboratorIds for loggedin user.
 *
 * @param {String} schema
 * @param {any} loggedInUser
 * @param {any} searchUserParams
 * @returns {Number[]}
 */
export async function getCollaboratorIds(
  schema: string,
  loggedInUser: any,
  searchUserParams: any
) {
  let collaboratorIds = [];
  // collaborators
  if (
    (searchUserParams.collaborators &&
      searchUserParams.collaborators?.length > 0) ||
    searchUserParams.collaborators === ALL
  ) {
    // Find the users that are collaborator of the loggedInUser
    const activeCollaborators = await userCollaboratorDao.findActiveCollaboratorsByUserId(
      schema,
      loggedInUser.userId
    );
    if (activeCollaborators)
      collaboratorIds = _.map(activeCollaborators, 'collaboratorId');
    collaboratorIds =
      searchUserParams.collaborators === ALL
        ? collaboratorIds
        : _.intersection(collaboratorIds, searchUserParams.collaborators);
  }
  return collaboratorIds;
}

/**
 * Returns mapped provider users, client domain ids and contact ids.
 *
 * @param {String} schema
 * @param {number[]} mappedProviderUserIds
 * @returns {Object}
 */
export async function getMappedDomainAndContactIds(
  schema: string,
  mappedProviderUserIds: number[]
) {
  let mappedClientDomainIds: any = [];
  let mappedClientContactIds: any = [];

  const providerUsersClientDomains = await clientDomainUserMappingDao.findByProviderUserIdIn(
    schema,
    mappedProviderUserIds
  );

  if (providerUsersClientDomains) {
    mappedClientDomainIds = _.map(providerUsersClientDomains, 'clientDomainId');

    const clientDomainContacts = await contactDao.findByClientDomainIdsIn(
      schema,
      mappedClientDomainIds
    );

    mappedClientContactIds = _.map(clientDomainContacts, 'id');
  }

  return {
    mappedProviderUserIds,
    mappedClientDomainIds,
    mappedClientContactIds
  };
}

/**
 * Returns client domain ids and contact ids for alias mappings.
 *
 * @param {String} schema
 * @param {any} loggedInUser
 * @param {any} searchUserParams
 * @returns {Object}
 */
export async function getAliasDomainAndContactIds(
  schema: string,
  loggedInUser: any,
  searchUserParams: any
) {
  let aliasClientDomainIds: number[] = [];
  let aliasClientContactIds: number[] = [];
  let aliasUserIds: number[] = [];
  if (
    (searchUserParams.aliases && searchUserParams.aliases.length > 0) ||
    searchUserParams.aliases === ALL
  ) {
    let aliasUserClientDomains;
    const activeAliasUsers: number[] = await userAliasDao.fetchActiveAliasUserByUserId(
      schema,
      loggedInUser.userId
    );
    if (activeAliasUsers) aliasUserIds = _.map(activeAliasUsers, 'aliasUserId');

    aliasUserIds =
      searchUserParams.aliases === ALL
        ? aliasUserIds
        : _.intersection(aliasUserIds, searchUserParams.aliases);
    if (aliasUserIds) {
      //Find the alias users mapped to this user and their clientDomains
      aliasUserClientDomains = await userAliasService.findAliasClientDomainsByUserAndAliasIdsIn(
        schema,
        loggedInUser.userId,
        aliasUserIds
      );
      aliasClientDomainIds = aliasUserClientDomains.clientDomainIds;
      aliasClientContactIds = aliasUserClientDomains.aliasClientContactIds;
    }
  }
  return { aliasUserIds, aliasClientDomainIds, aliasClientContactIds };
}

/**
 * Get client domain ids by logged in user.
 *
 * @param loggedInUser
 */
export async function getClientDomainIdsByLoggedInUser(
  schema: string,
  loggedInUser: any,
  searchUserParams: any
) {
  const userIds: any = [];
  let supervisorUserIds: any = [];

  // me or personal domains
  if (_.isEmpty(searchUserParams) || searchUserParams.me) {
    if (loggedInUser.role == roleMapper.SUPERVISOR) {
      supervisorUserIds = await getUserSubordinateIds(schema, loggedInUser);
    }
    userIds.push(...supervisorUserIds, loggedInUser.userId);
  }

  const {
    subordinateIds,
    subordinateClientDomainIds,
    subordinateClientContactIds
  } = await getSubordinateDomainAndContactIds(
    schema,
    loggedInUser,
    searchUserParams
  );

  const collaboratorIds = await getCollaboratorIds(
    schema,
    loggedInUser,
    searchUserParams
  );

  // client domain mappings(includes personal domains, client domains and subordinate domains)
  const aggregatedProviderUserIds = [
    ...userIds,
    ...collaboratorIds,
    ...subordinateIds
  ];

  const providerUserIds = [...new Set(aggregatedProviderUserIds)];

  const {
    mappedProviderUserIds,
    mappedClientDomainIds,
    mappedClientContactIds
  } = await getMappedDomainAndContactIds(schema, providerUserIds);

  const {
    aliasUserIds,
    aliasClientDomainIds,
    aliasClientContactIds
  } = await getAliasDomainAndContactIds(schema, loggedInUser, searchUserParams);

  const clientDomainIds = [
    ...mappedClientDomainIds,
    ...subordinateClientDomainIds,
    ...aliasClientDomainIds
  ];
  const allClientDomainIds = _.compact(clientDomainIds);

  return {
    aliasUserIds,
    subordinateIds,
    collaboratorIds,
    mappedProviderUserIds,
    aliasClientDomainIds,
    aliasClientContactIds,
    subordinateClientDomainIds,
    subordinateClientContactIds,
    allClientDomains: allClientDomainIds,
    domainMappingClientDomains: mappedClientDomainIds,
    domainMappingClientContacts: mappedClientContactIds
  };
}

/**
 * Find contact by id.
 *
 * @param email string
 * @returns Promise
 */
export async function findById(
  schema: string,
  id: number
): Promise<IContact | null> {
  logger.info('Finding client contact with id %s', id);
  return await contactDao.findOne(schema, { id });
}

/**
 * Fetch contacts by contact ids
 *
 * @param query object
 * @returns Promise
 */
export async function findByIds(
  schema: string,
  contactIds: number[]
): Promise<IContact[] | null> {
  return await contactDao.findByIds(schema, contactIds);
}

/**
 * Find contact by email.
 *
 * @param email string
 * @returns Promise
 */
export async function findByEmail(
  schema: string,
  email: string
): Promise<IContact | null> {
  return await contactDao.findOne(schema, { email });
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
  updateInformation: any
) {
  if (!Object.keys(updateInformation).length) {
    throw new BadRequestError(errorMessage.UpdateInformationEmpty);
  }

  logger.log('info', 'Fetching contact data by id', id);
  const contact = await contactDao.findById(schema, id);
  if (!contact) {
    throw new BadRequestError(errorMessage.ContactNotFound);
  }
  const {
    firstName,
    lastName,
    position,
    companyName,
    workPhoneNumber,
    cellPhoneNumber,
    address
  } = updateInformation;

  const updateParams: any = {};

  if (ContactFields.FIRST_NAME in updateInformation) {
    updateParams.firstName = firstName;
  }

  if (ContactFields.LAST_NAME in updateInformation) {
    updateParams.lastName = lastName;
  }

  if (ContactFields.WORK_PHONE_NUMBER in updateInformation) {
    const workNumbers = JSON.stringify(workPhoneNumber);
    updateParams.workPhoneNumber = workNumbers;
  }

  if (ContactFields.CELL_PHONE_NUMBER in updateInformation) {
    const cellNumbers = JSON.stringify(cellPhoneNumber);
    updateParams.cellPhoneNumber = cellNumbers;
  }

  if (ContactFields.ADDRESS in updateInformation) {
    updateParams.address = address;
  }

  if (ContactFields.POSITION in updateInformation) {
    updateParams.position = position;
  }

  if (ContactFields.COMPANY_NAME in updateInformation) {
    updateParams.contactOrganizationName = companyName;
  }
  return await contactDao.updateById(schema, id, updateParams);
}

/*
 * Get the client domain contact by
 * using the provider user thread id
 *
 * @param schema string
 * @param id number
 * */
export async function findByProviderUserThreadId(
  schema: string,
  id: number
): Promise<any | null> {
  return await contactDao.findByProviderUserThreadId(schema, id);
}
