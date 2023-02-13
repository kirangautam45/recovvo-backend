import * as _ from 'lodash';

import {
  paginateData,
  getPageParams,
  getSortParams
} from '../../core/utils/recovoUtils';
import * as s3Service from './s3.service';
import * as userDao from '../user/user.dao';
import Event from '../common/enums/event.enum';
import errorMessage from './messagePart.errors';
import * as messagePartDao from './messagePart.dao';
import JWTPayload from '../auth/dto/jwtPayload.dto';
import roleMapper from '../user/mapper/role.mapper';
import * as contactDao from '../contact/contact.dao';
import * as mixPanelService from '../../core/utils/mixpanel';
import { DEFAULT_SORT_FIELD } from './messagePart.constants';
import IMessagePart from './interfaces/messagePart.interface';
import UserSupervisor from '../userMappings/userSupervisor.model';
import BadRequestError from '../../core/exceptions/BadRequestError';
import { splitWithFilter, concatWithFilter } from '../../core/utils/string';
import VisibleProvidersInfo from './interfaces/visibleProvidersInfo.interface';
import * as clientDomainUserMappingDao from '../clientDomain/clientDomainUserMapping.dao';
import * as userSenderReceiverAssociationDao from '../userSenderReceiverAssociation/userSenderReceiverAssociation.dao';

/**
 * Updates messagepart.
 * @params schema String
 * @params id Number
 * @params updateParams Object
 *
 * @returns Promise
 */
export async function update(
  schema: string,
  id: number,
  updateParams: any
): Promise<IMessagePart> {
  return await messagePartDao.update(schema, id, updateParams);
}

/**
 * finds all messagepart.
 * @params schema String
 * @params searchParams Object
 *
 * @returns Promise
 */
export async function find(
  schema: string,
  searchParams: any
): Promise<IMessagePart[]> {
  return await messagePartDao.find(schema, searchParams);
}

/**
 * Gets presigned url from attachment url
 *
 * @param id number
 */
export async function getPressignedUrl(
  loggedInPayload: JWTPayload,
  schema: string,
  id: number
) {
  const messagePart = await messagePartDao.findById(schema, id);

  if (!messagePart) {
    throw new BadRequestError(errorMessage.MessagePartNotFound);
  }
  const authorizationError = await authorizeToGetPressignedUrl(
    schema,
    loggedInPayload,
    messagePart.messageId
  );

  if (authorizationError) {
    throw new BadRequestError(authorizationError);
  }

  if (!messagePart.isAttachment) {
    throw new BadRequestError(errorMessage.MessagePartNotAttachment);
  }

  if (messagePart.attachmentUrl.length === 0) {
    throw new BadRequestError(errorMessage.AttachmentUrlNotPresent);
  }
  mixPanelService.trackEvent(
    Event.DOWNLOAD_DOCUMENT,
    loggedInPayload.email,
    ''
  );

  return await s3Service.getPresignedUrl(schema, messagePart.attachmentUrl);
}

async function authorizeToGetPressignedUrl(
  schema: string,
  loggedInPayload: JWTPayload,
  threadMessageId: number
) {
  if (loggedInPayload.role === roleMapper.ADMIN) {
    return;
  }
  const users = await UserSupervisor.find({
    supervisorId: loggedInPayload.userId,
    isDeleted: false
  })
    .withSchema(schema)
    .pluck('user_id');
  users.push(Number(loggedInPayload.userId));

  const authorizedClientDomainUsers = await clientDomainUserMappingDao.findByProviderUserIdIn(
    schema,
    users
  );
  const authorizedClientDomains = _.map(
    authorizedClientDomainUsers,
    'clientDomainId'
  );
  const mappedClientDomains = await userSenderReceiverAssociationDao.find(
    schema,
    { threadMessageId }
  );
  const mappedClientDomain = mappedClientDomains.find(
    (clientDomain) => clientDomain !== null
  );

  if (
    mappedClientDomain &&
    authorizedClientDomains.includes(Number(mappedClientDomain))
  ) {
    return;
  }
  return errorMessage.UserNotAllowed;
}

/**
 * Fetch attachments with filter and page
 *
 * @param query
 */
export async function fetchAttachmentsWithFilterAndPage(
  loggedInEmail: string,
  schema: string,
  visibleProviderUsers: {
    data: VisibleProvidersInfo[];
    contactId: number;
  }[],
  query?: any
) {
  const pageParams = getPageParams(query);
  const filter = query;
  const sortParams = getSortParams(query, DEFAULT_SORT_FIELD);

  const messageParts = await messagePartDao.fetchAttachmentsWithFilterAndPage(
    schema,
    pageParams,
    sortParams,
    visibleProviderUsers,
    filter
  );

  const totalAttachment = await messagePartDao.fetchTotalAttachmentsCount(
    schema,
    visibleProviderUsers,
    filter
  );
  const attachments = await getAndSetAttachments(
    schema,
    messageParts,
    loggedInEmail
  );

  mixPanelService.trackEvent(
    Event.SEARCH_DOCUMENTS,
    loggedInEmail,
    JSON.stringify(query)
  );

  return paginateData(attachments, pageParams, totalAttachment.count);
}

/**
 * Get and set attachments.
 *
 * @param messageParts
 */
async function getAndSetAttachments(
  schema: string,
  messageParts: any[],
  currentUserEmail: string
) {
  const participantEmails = _.map(messageParts, 'participantEmails');
  const allParticipantEmails = participantEmails.reduce((acc: any[], val) => {
    return acc.concat(splitWithFilter(val));
  }, []);

  const providerUsers = await userDao.findByEmailWhereIn(
    schema,
    {},
    allParticipantEmails
  );
  const contacts = await contactDao.findByEmailIn(schema, allParticipantEmails);

  const attachments = messageParts.map((messagePart: any) => {
    const messagePartEmails = splitWithFilter(messagePart.partTo);

    const receiverEmails = messagePartEmails.map((email: string) => {
      const fullName = concatWithFilter(
        findUserFullNameByEmail(providerUsers, contacts, email)
      );
      return { fullName, email };
    });

    const senderReceiverEmails = splitWithFilter(messagePart.participantEmails);
    const isSuppressed = providerUsers
      .filter((user) =>
        senderReceiverEmails.find((email: any) => email == user.email)
      )
      .every(
        (user) => user.email != currentUserEmail && user.isSuppressed == true
      );

    return { ...messagePart, receiverEmails, isSuppressed };
  });

  return attachments;
}

/**
 * Find participants full name by email.
 *
 * @param providerUsers
 * @param contacts
 * @param email
 */
function findUserFullNameByEmail(
  providerUsers: any[],
  contacts: any[],
  email: string
) {
  const providerUser = providerUsers.find((user: any) => user.email == email);

  if (providerUser) {
    return [providerUser.firstName, providerUser.lastName];
  }

  const contact = contacts.find((contact: any) => contact.email == email);
  if (contact) {
    return [contact.firstName, contact.lastName];
  }

  return [];
}
