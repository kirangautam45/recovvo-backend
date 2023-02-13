import _ from 'lodash';
import moment from 'moment';

import lang from '../../core/common/lang';
import * as userDao from '../user/user.dao';
import IUser from '../user/interfaces/user.interface';
import { isObjectEmpty } from '../../core/utils/object';
import { splitWithFilter } from '../../core/utils/string';
import * as messagePart from '../messagePart/messagePart.dao';
import * as providerUserThread from './providerUserThread.dao';
import ForbiddenError from '../../core/exceptions/ForbiddenError';
import * as userAliasDao from '../userAliasMappings/userAlias.dao';
import * as threadMessage from '../threadMessage/threadMessage.dao';
import * as userSupervisorDao from '../userMappings/userSupervisor.dao';
import { paginateData, getPageParams } from '../../core/utils/recovoUtils';
import IProviderUserThread from './interfaces/providerUserThread.interface';
import SearchAccessType from '../../client/common/enums/searchAccessType.enum';
import HeaderType from '../userSenderReceiverAssociation/enums/headerType.enum';
import { DEFAULT_DATE_FORMAT } from '../../client/common/constants/dateTimeConstants';
import { IUserAlias } from '../../client/userAliasMappings/interfaces/userAlias.interface';
import IVisibleProvidersInfo from '../../client/messagePart/interfaces/visibleProvidersInfo.interface';
import IEmailAccessTimeFrame from '../organizationOperation/interfaces/emailAccessTimeFrame.interface';
import * as organizationOperationService from '../organizationOperation/organizationOperation.service';

const { errors } = lang;

/**
 *
 * @param {string} schema
 * @param contact
 * @param loggedInEmail
 * @returns
 */
export async function fetchVisibleEmailsProviderIds(
  schema: string,
  contact: any,
  loggedInUser: any,
  supervisorMappings: any
): Promise<IVisibleProvidersInfo[]> {
  switch (contact.contactAccessType) {
    case SearchAccessType.DOMAIN_MAPPING:
      return [];
    case SearchAccessType.ALIAS:
      const aliasMappings = await userAliasDao.findByAliasIdsIn(
        schema,
        contact.contactFrom,
        loggedInUser.userId
      );

      return aliasMappings.map((aliasInfo) => {
        return {
          providerUserId: aliasInfo.aliasUserId,
          emailsFrom: moment(aliasInfo.historicalEmailAccessStartDate).format(
            DEFAULT_DATE_FORMAT
          ),
          emailsTo: moment(aliasInfo.historicalEmailAccessEndDate).format(
            DEFAULT_DATE_FORMAT
          )
        };
      });
    case SearchAccessType.SUPERVISOR_CONTINUOUS:
      const visibleProviderUserIds = _.intersection(
        contact.contactFrom,
        _.map(supervisorMappings, 'userId')
      );

      return visibleProviderUserIds.map((id) => {
        return {
          providerUserId: id
        };
      });
    default:
      return [];
  }
}

/**
 * Fetch list of provider user threads with filtered query.
 *
 * @returns Promise
 */
export async function fetchByContactId(
  schema: string,
  contact: any,
  loggedInUser: any,
  query?: any
) {
  const pageParams = getPageParams(query);
  const filter = _.pick(query, ['secondarySearch']);

  const supervisorMappings = await userSupervisorDao.find(schema, {
    supervisorId: loggedInUser.userId,
    isDeleted: false
  });

  const providerFilterInfo = await fetchVisibleEmailsProviderIds(
    schema,
    contact,
    loggedInUser,
    supervisorMappings
  );

  const providerUserThreads = await providerUserThread.fetchByContactId(
    schema,
    contact.id,
    providerFilterInfo,
    pageParams,
    filter
  );

  const threads = await getAndSetThreads(
    schema,
    providerUserThreads,
    loggedInUser.email
  );

  const totalProviderUserThread = await providerUserThread.fetchTotalProviderUserThreadWithFilter(
    schema,
    contact.id,
    providerFilterInfo,
    filter
  );

  return paginateData(threads, pageParams, totalProviderUserThread.count);
}

/**
 * Fetch list of provider user threads with filtered query.
 *
 * @returns Promise
 */

export async function fetchByUserId(
  schema: string,
  responseLocals: any,
  query?: any
): Promise<IProviderUserThread[]> {
  const { subOrdinateInfo, loggedInPayload } = responseLocals;
  const { id } = subOrdinateInfo;
  const pageParams = getPageParams(query);
  const searchParam = _.pick(query, ['secondarySearch']);
  const {
    hasClientResponses,
    emailsFrom,
    emailsUpto,
    sortField,
    sortDirection,
    hasAttachments
  } = query;

  const sortParams = {
    field: sortField,
    direction: sortDirection
  };

  const durationParams = {
    emailsFrom,
    emailsUpto
  };

  const providerUserThreads = await providerUserThread.fetchByUserId(
    schema,
    id,
    pageParams,
    searchParam,
    durationParams,
    hasAttachments,
    sortParams,
    hasClientResponses
  );

  const threads = await handleSnippetHide(
    schema,
    providerUserThreads,
    loggedInPayload
  );

  const allProviderUserThreads = await providerUserThread.fetchThreadsWithoutPagination(
    schema,
    id,
    searchParam,
    durationParams,
    hasAttachments,
    hasClientResponses
  );

  return paginateData(threads, pageParams, allProviderUserThreads.count);
}

/**
 * Fetch list of provider user threads with filtered query.
 *
 * @returns Promise
 */

export async function fetchByAliasId(
  schema: string,
  responseLocals: any,
  query?: any
) {
  const { aliasInfo, loggedInPayload } = responseLocals;
  const { id } = aliasInfo;
  const pageParams = getPageParams(query);
  const searchParam = _.pick(query, ['secondarySearch']);

  let { emailsFrom, emailsUpto } = query;
  const {
    sortField,
    sortDirection,
    hasAttachments,
    hasClientResponses
  } = query;

  const { userId } = loggedInPayload;

  const sortParams = {
    field: sortField,
    direction: sortDirection
  };

  const organizationOperation = await organizationOperationService.getEmailAccessTimeFrame(
    schema
  );

  const aliasDetail = await userAliasDao.findOne(schema, {
    userId,
    aliasUserId: Number(id)
  });

  if (!aliasDetail) {
    throw new ForbiddenError(errors.unAuthorized);
  }

  [emailsFrom, emailsUpto] = getValidEmailRange(
    aliasDetail,
    organizationOperation,
    emailsFrom,
    emailsUpto
  );

  const durationParams = {
    emailsFrom,
    emailsUpto
  };

  const providerUserThreads = await providerUserThread.fetchByUserId(
    schema,
    id,
    pageParams,
    searchParam,
    durationParams,
    hasAttachments,
    sortParams,
    hasClientResponses
  );

  const threads = await handleSnippetHide(
    schema,
    providerUserThreads,
    loggedInPayload
  );

  const allProviderUserThreads = await providerUserThread.fetchThreadsWithoutPagination(
    schema,
    id,
    searchParam,
    durationParams,
    hasAttachments,
    hasClientResponses
  );

  return paginateData(threads, pageParams, allProviderUserThreads.count);
}

/**
 * Returns email range considering company wide email access setting,
 * historical time range and date range given in query.
 */
function getValidEmailRange(
  aliasDetail: IUserAlias,
  organizationOperation: IEmailAccessTimeFrame,
  emailsFrom: string,
  emailsUpto: string
) {
  let historicalEmailAccessStartDate = moment(
    aliasDetail.historicalEmailAccessStartDate
  );
  const historicalEmailAccessEndDate = moment(
    aliasDetail.historicalEmailAccessEndDate
  );

  if (
    organizationOperation &&
    organizationOperation.isEmailAccessTimeFrameSet &&
    organizationOperation.emailAccessStartDate
  ) {
    const companyWideEmailAccessFrom = moment(
      organizationOperation.emailAccessStartDate
    );

    historicalEmailAccessStartDate = moment.max(
      historicalEmailAccessStartDate,
      companyWideEmailAccessFrom
    );
  }

  if (emailsFrom) {
    emailsFrom = moment
      .max(historicalEmailAccessStartDate, moment(emailsFrom))
      .format(DEFAULT_DATE_FORMAT);
  } else {
    emailsFrom = historicalEmailAccessStartDate.format(DEFAULT_DATE_FORMAT);
  }
  if (emailsUpto) {
    emailsUpto = moment
      .min(historicalEmailAccessEndDate, moment(emailsUpto))
      .format(DEFAULT_DATE_FORMAT);
  } else {
    emailsUpto = historicalEmailAccessEndDate.format(DEFAULT_DATE_FORMAT);
  }
  return [emailsFrom, emailsUpto];
}

/**
 * Get threads.
 *
 * @param contact
 * @param providerUserThreads
 */
async function getAndSetThreads(
  schema: string,
  providerUserThreads: any[],
  currentUserEmail: string
) {
  const participantEmails = _.map(providerUserThreads, 'emails');
  const receiverParticipantEmails = _.map(
    providerUserThreads,
    'senderReceiverEmails'
  );

  const providerUsers = await getUsersByParticipantEmails(
    schema,
    participantEmails
  );

  const receiverProviderUsers = await getUsersByParticipantEmails(
    schema,
    receiverParticipantEmails
  );

  const threads = await Promise.all(
    providerUserThreads.map(async (providerUserThread: any) => {
      const threadEmails = splitWithFilter(providerUserThread.emails);

      let validThreadEmails = threadEmails.filter((email: string) => {
        return providerUsers.find(
          (providerUser) => providerUser.email == email
        );
      });

      const otherThreadEmails = splitWithFilter(
        providerUserThread.senderReceiverEmails
      );

      if (validThreadEmails.length === 0) {
        validThreadEmails = otherThreadEmails.filter((email: string) => {
          return receiverProviderUsers.find(
            (receiverUser) => receiverUser.email == email
          );
        });
      }

      const appUsers = await userDao.findByEmailWhereIn(
        schema,
        { isSuppressed: false },
        validThreadEmails
      );

      if (
        appUsers.length !== 0 ||
        validThreadEmails.includes(currentUserEmail)
      ) {
        return {
          ...providerUserThread,
          isSnippetHidden: false,
          emails: validThreadEmails
        };
      } else {
        return {
          ...providerUserThread,
          snippet: '',
          subject: '',
          isSnippetHidden: true,
          emails: validThreadEmails
        };
      }
    })
  );

  return threads;
}

/**
 * Get threads with snippet hidden or not information.
 *
 * @param loggedInPayload any
 * @param providerUserThreads object
 */
async function handleSnippetHide(
  schema: string,
  providerUserThreads: any[],
  loggedInPayload: any
) {
  const loggedInUserEmail = loggedInPayload.email;

  const allParticipantEmails = _.map(
    providerUserThreads,
    'senderReceiverEmails'
  );

  const allProviderUsers = await getUsersByParticipantEmails(
    schema,
    allParticipantEmails
  );

  const threads = await Promise.all(
    providerUserThreads.map(async (providerUserThread: any) => {
      const allThreadEmails = splitWithFilter(
        providerUserThread.senderReceiverEmails
      );

      const validThreadEmails = allThreadEmails.filter((email: string) => {
        return allProviderUsers.find((user) => user.email === email);
      });

      const appUsers = await userDao.findByEmailWhereIn(
        schema,
        { isSuppressed: false },
        validThreadEmails
      );

      if (
        appUsers.length !== 0 ||
        validThreadEmails.includes(loggedInUserEmail)
      ) {
        return {
          ...providerUserThread,
          isSnippetHidden: false,
          emails: [providerUserThread.emails]
        };
      }
      return {
        ...providerUserThread,
        snippet: '',
        subject: '',
        isSnippetHidden: true,
        emails: [providerUserThread.emails]
      };
    })
  );

  return threads;
}

/**
 * Get provider users by participant emails.
 *
 * @param participantEmails
 */
async function getUsersByParticipantEmails(
  schema: string,
  participantEmails: string[]
): Promise<IUser[]> {
  const allParticipantEmails = participantEmails.reduce((acc: any[], val) => {
    return acc.concat(splitWithFilter(val));
  }, []);

  const providerUsers = await userDao.findByEmailWhereIn(
    schema,
    {},
    allParticipantEmails
  );

  return providerUsers;
}

/**
 * Fetch list of provider user threads with filtered query.
 *
 * @returns Promise
 */
export async function fetchByThreadId(
  schema: string,
  threadId: number,
  currentUserEmail: string
) {
  const messages = await threadMessage.fetchByThreadId(schema, threadId);

  if (messages.length == 0) return [];

  return await getMessagesWithAttachments(schema, messages, currentUserEmail);
}

/**
 * Get messages with attachments.
 *
 * @param {any[]} messages
 */
async function getMessagesWithAttachments(
  schema: string,
  messages: any[],
  currentUserEmail: string
) {
  const messageIds = _.map(messages, 'id');
  const participantEmails = _.map(messages, 'participantEmails');
  const providerUsers = await getUsersByParticipantEmails(
    schema,
    participantEmails
  );
  const messageAttachments = await messagePart.fetchAttachmentsByMessageIdIn(
    schema,
    messageIds
  );
  let msg = {};

  const data = messages.reduce((acc: [], message: any) => {
    if (isObjectEmpty(msg)) {
      msg = {
        id: message.id,
        subject: Buffer.from(message.subject, 'base64').toString('utf-8'),
        from: message.partFrom,
        to: splitWithFilter(message.partTo),
        cc: splitWithFilter(message.cc),
        bcc: splitWithFilter(message.bcc)
      };
    }

    const attachments = messageAttachments.filter(
      (attachment: any) => attachment.messageId == message.id
    );
    const fullName =
      message.headerType == HeaderType.TO
        ? null
        : [message.firstName, message.lastName]
            .filter((it) => !!it)
            .join(' ') || null;

    const threadEmails = splitWithFilter(message.participantEmails);
    // Get all the users,then check if the users are suppressed
    // Suppression condition: all users are suppressed && current user is not in the conversation
    const isSuppressed = providerUsers
      .filter((user) => threadEmails.find((email) => email == user.email))
      .every(
        (user) => user.email != currentUserEmail && user.isSuppressed == true
      );

    return [
      ...acc,
      {
        id: isSuppressed ? '-' : message.id,
        fullName,
        email:
          message.headerType == HeaderType.TO
            ? message.partFrom
            : message.email,
        subject: isSuppressed
          ? ''
          : Buffer.from(message.subject, 'base64').toString('utf-8'),
        messageDatetime: message.messageDatetime,
        isSuppressed,
        bodyData: isSuppressed
          ? ''
          : Buffer.from(message.bodyData, 'base64').toString('utf-8'),
        attachments
      }
    ];
  }, []);

  return { ...msg, data };
}

/**
 * Fetch client domain ids by provider user id.
 *
 * @param providerUserThreadId number
 */
export async function fetchClientDomainIdsById(
  schema: string,
  providerUserThreadId: number
): Promise<any> {
  return await providerUserThread.fetchClientDomainIdsById(
    schema,
    providerUserThreadId
  );
}

/**
 * Fetch client domain ids by provider user id.
 *
 * @param providerUserThreadId number
 */
export async function fetchEmailsCount(
  schema: string,
  userId: number
): Promise<any> {
  return await providerUserThread.fetchTotalThreadCountByUserId(schema, userId);
}
