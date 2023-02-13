import _ from 'lodash';
import Knex from 'knex';
import { Transaction } from 'knex';

import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import { attachmentSort } from './messagePart.sort';
import { messagePartFilter } from './messagePart.filter';
import { ROOT_MESSAGE_PARTS } from './messagePart.constants';
import { contactFilter } from '../contact/filter/contact.filter';
import { filterByEmailAccessStartDateQuery } from '../../core/utils/query';
import IVisibleProvidersInfo from './interfaces/visibleProvidersInfo.interface';
import ProviderUserThread from '../../client/providerUserThread/providerUserThread.model';
import { DO_NOT_REPLY_REGEX } from '../../client/providerUserThread/providerUserThread.constant';
import SenderReceiverUserType from '../userSenderReceiverAssociation/enums/senderReceiverUserType.enum';
import UserSenderReceiverAssociation from '../userSenderReceiverAssociation/userSenderReceiverAssociation.model';
import {
  PROVIDER_DOMAIN_LIST,
  MIME_TYPE_LIST
} from '../common/constants/exclusionList';

/**
 * MessagePart Model
 */
class MessagePart extends BaseModel {
  public static table: string = Table.MESSAGE_PARTS;

  /**
   * Fetch attachments by message ids
   *
   * @param messageIds number[]
   */
  static fetchAttachmentsByMessageIdIn(schema: string, messageIds: number[]) {
    const attachments = super
      .queryBuilder()(Table.MESSAGE_PARTS)
      .withSchema(schema)
      .select('id', 'file_name', 'mime_type', 'message_id', 'body_size')
      .where(`${Table.MESSAGE_PARTS}.is_attachment`, true)
      .whereIn('message_id', messageIds)
      .whereNotIn(Table.MESSAGE_PARTS + '.mime_type', MIME_TYPE_LIST);
    return attachments;
  }

  /**
   * Update message part
   * @param schema string
   * @param searchParams object
   * @param updateParams object
   */
  public static updateMessagePartById(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.MESSAGE_PARTS)
      .withSchema(schema)
      .update(updateParams)
      .where(searchParams)
      .returning('*');

    return qb;
  }

  /**
   * Get Attachment count by message id.
   *
   * @param column
   */
  static getAttachmentCountByThreadIdSubQuery(schema: string, column: string) {
    const queryBuilder = super
      .queryBuilder()(Table.MESSAGE_PARTS)
      .withSchema(schema)
      .join(
        Table.THREAD_MESSAGES,
        `${Table.THREAD_MESSAGES}.id`,
        '=',
        `${Table.MESSAGE_PARTS}.message_id`
      )
      .where(`${Table.MESSAGE_PARTS}.is_attachment`, true)
      .where(
        `${Table.THREAD_MESSAGES}.thread_id`,
        super.getConnection().ref(column)
      )
      .whereNotIn(Table.MESSAGE_PARTS + '.mime_type', MIME_TYPE_LIST)

      .countDistinct([
        `${Table.MESSAGE_PARTS}.id`,
        `${Table.MESSAGE_PARTS}.sp_part_id`
      ]);

    return queryBuilder;
  }

  /**
   * Fetch message body data by message id
   * @param messageId
   */
  static fetchBodyDataByMessageId(schema: string, messageId: any) {
    const qb = super
      .queryBuilder()(Table.MESSAGE_PARTS)
      .withSchema(schema)
      .select('body_data')
      .where('message_id', messageId)
      .whereIn('mime_type', ['text/html', 'text/plain', 'html'])
      .orderBy('mime_type', 'text/html', 'desc')
      .limit(1);

    return qb;
  }

  static async fetchTotalAttachmentsCount(
    schema: string,
    visibleProviderUsers: any,
    filter: any
  ) {
    const qb = (
      await this.fetchAttachmentsWithFilter(
        schema,
        visibleProviderUsers,
        filter
      )
    ).queryBuilder;

    qb.countDistinct([
      `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sp_original_message_id`,
      `${Table.MESSAGE_PARTS}.sp_part_id`
    ]).first();

    return qb;
  }
  /**
   * Fetch attachments with filter
   *
   * @param filter
   */
  static async fetchAttachmentsWithFilter(
    schema: string,
    visibleProviderUsers?: {
      data: IVisibleProvidersInfo[];
      contactId: number;
    }[],
    filter?: any
  ) {
    let queryBuilder = super
      .queryBuilder()(Table.MESSAGE_PARTS)
      .withSchema(schema)
      .join(
        Table.USER_SENDER_RECEIVER_ASSOCIATION,
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.thread_message_id`,
        '=',
        `${Table.MESSAGE_PARTS}.message_id`
      )
      .join(
        Table.PROVIDER_USER_THREADS,
        `${Table.PROVIDER_USER_THREADS}.id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`
      )
      .join(
        Table.CLIENT_DOMAIN_CONTACTS,
        `${Table.CLIENT_DOMAIN_CONTACTS}.id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_id`
      )
      .join(
        Table.CLIENT_DOMAINS,
        `${Table.CLIENT_DOMAINS}.id`,
        '=',
        `${Table.CLIENT_DOMAIN_CONTACTS}.client_domain_id`
      )
      .join(
        this.fetchRootMessageParts(schema).as(ROOT_MESSAGE_PARTS),
        `${ROOT_MESSAGE_PARTS}.message_id`,
        '=',
        `${Table.MESSAGE_PARTS}.message_id`
      )
      .join(
        Table.PROVIDER_USERS,
        `${Table.PROVIDER_USERS}.id`,
        '=',
        `${Table.PROVIDER_USER_THREADS}.provider_user_id`
      )
      .where(`${Table.MESSAGE_PARTS}.is_attachment`, true)
      .where(
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_type`,
        SenderReceiverUserType.CLIENT_DOMAIN_CONTACT
      )

      .whereNotIn(`${Table.CLIENT_DOMAINS}.domain`, PROVIDER_DOMAIN_LIST)
      .whereNotIn(Table.MESSAGE_PARTS + '.mime_type', MIME_TYPE_LIST);

    queryBuilder.whereRaw(
      `${ROOT_MESSAGE_PARTS}.part_from !~ ?`,
      DO_NOT_REPLY_REGEX
    );

    if (visibleProviderUsers) {
      queryBuilder = this.visibleProviderUsersFilter(
        queryBuilder,
        visibleProviderUsers
      );
    }

    if (filter) {
      queryBuilder = (await contactFilter(schema, queryBuilder, filter))
        .queryBuilder;
      queryBuilder = messagePartFilter(queryBuilder, filter);
    }

    const newQb = (
      await filterByEmailAccessStartDateQuery(
        queryBuilder,
        schema,
        'user_sender_receiver_association'
      )
    ).queryBuilder;

    return { queryBuilder: newQb };
  }

  /**
   * Gets raw query after filtering non visible provider users out
   *
   * @param queryBuilder Querybuilder
   * @param visibleProviderUsers array
   */
  static visibleProviderUsersFilter(
    queryBuilder: Knex.QueryBuilder,
    visibleProviderUsers: {
      data: IVisibleProvidersInfo[];
      contactId: number;
    }[]
  ): Knex.QueryBuilder {
    let caseWhenStatement = '';
    let accessTimeRangeRawQuery;
    visibleProviderUsers.forEach((visibleProviderUserInfo: any) => {
      if (visibleProviderUserInfo.data.length > 0) {
        const providerUserIds = _.map(
          visibleProviderUserInfo.data,
          'providerUserId'
        );
        accessTimeRangeRawQuery = ProviderUserThread.buildAccessTimeRangeRawQuery(
          visibleProviderUserInfo.data
        );
        if (accessTimeRangeRawQuery.length === 0) {
          caseWhenStatement = caseWhenStatement.concat(
            ' ',
            `WHEN ${Table.CLIENT_DOMAIN_CONTACTS}.id = ${visibleProviderUserInfo.contactId} THEN  
           ${Table.PROVIDER_USERS}.id in (${providerUserIds})`
          );
        } else {
          caseWhenStatement = caseWhenStatement.concat(
            ' ',
            `WHEN ${Table.CLIENT_DOMAIN_CONTACTS}.id = ${visibleProviderUserInfo.contactId} THEN  
           (${Table.PROVIDER_USERS}.id in (${providerUserIds}) AND ${accessTimeRangeRawQuery})`
          );
        }
      }
    });

    if (caseWhenStatement)
      queryBuilder.whereRaw(`CASE ${caseWhenStatement} ELSE TRUE END`);

    return queryBuilder;
  }

  /**
   * Fetch attachments
   *
   * @param pageParams
   * @param sortParams
   * @param filter
   */
  static async fetchAttachmentsWithFilterAndPage(
    schema: string,
    pageParams: { page: number; pageSize: number },
    sortParams: { field: string; direction: string },
    visibleProviderUsers: {
      data: IVisibleProvidersInfo[];
      contactId: number;
    }[],
    filter?: any
  ) {
    const offset = (pageParams.page - 1) * pageParams.pageSize;

    let qb = (
      await this.fetchAttachmentsWithFilter(
        schema,
        visibleProviderUsers,
        filter
      )
    ).queryBuilder;

    qb.select(
      `${Table.MESSAGE_PARTS}.id`,
      `${Table.MESSAGE_PARTS}.file_name`,
      `${Table.MESSAGE_PARTS}.mime_type`,
      `${Table.MESSAGE_PARTS}.body_size`,
      `${Table.CLIENT_DOMAINS}.domain`,
      `${ROOT_MESSAGE_PARTS}.part_from as sender_email`,
      `${ROOT_MESSAGE_PARTS}.part_to`,
      this.rawQueryToGetEmails(),
      UserSenderReceiverAssociation.fetchFullNameByMessageId(
        schema,
        super.getConnection().ref(`${Table.MESSAGE_PARTS}.message_id`)
      ).as('sender_full_name'),
      `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.message_datetime`,
      `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_id as contact_id`,
      `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`
    )
      .distinctOn([
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sp_original_message_id`,
        `${Table.MESSAGE_PARTS}.sp_part_id`
      ])
      .orderBy([
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sp_original_message_id`,
        `${Table.MESSAGE_PARTS}.sp_part_id`
      ]);

    qb = attachmentSort(qb, sortParams);
    qb.offset(offset).limit(pageParams.pageSize);

    // const newQb = (
    //   await filterByEmailAccessStartDateQuery(
    //     qb,
    //     schema,
    //     'user_sender_receiver_association'
    //   )
    // ).qb;

    return qb;
  }

  /**
   * Raw query to get emails.
   */
  static rawQueryToGetEmails() {
    return super.getConnection().raw(`
      CONCAT_WS(',', 
        ${ROOT_MESSAGE_PARTS}.part_from, 
        ${ROOT_MESSAGE_PARTS}.part_to, 
        ${ROOT_MESSAGE_PARTS}.cc, 
        ${ROOT_MESSAGE_PARTS}.bcc
      ) as participant_emails
    `);
  }

  /**
   * Fetch root message parts.
   */
  static fetchRootMessageParts(schema: string) {
    const qb = super
      .queryBuilder()(Table.MESSAGE_PARTS)
      .withSchema(schema)
      .where('is_root_part', true);

    return qb;
  }
}

export default MessagePart;
