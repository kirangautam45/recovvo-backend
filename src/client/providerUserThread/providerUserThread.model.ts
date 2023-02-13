import _ from 'lodash';
import Knex from 'knex';
import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import Contact from '../contact/contact.model';
import MessagePart from '../messagePart/messagePart.model';
import { DO_NOT_REPLY_REGEX } from './providerUserThread.constant';
import { PROVIDER_DOMAIN_LIST } from '../common/constants/exclusionList';
import { filterByEmailAccessStartDateQuery } from '../../core/utils/query';
import HeaderType from '../userSenderReceiverAssociation/enums/headerType.enum';
import { DEFAULT_DATE_TIME_FORMAT } from '../../client/common/constants/dateTimeConstants';
import SenderReceiverUserType from '../userSenderReceiverAssociation/enums/senderReceiverUserType.enum';
import UserSenderReceiverAssociation from '../userSenderReceiverAssociation/userSenderReceiverAssociation.model';

export const emailOrderFields = {
  ATTACTHMENT_COUNT: 'attachmentCount',
  LAST_UPDATED_DATE_TIME: 'lastUpdatedDateTime'
};

export const emailOrderDirections = {
  ASC: 'asc',
  DESC: 'desc'
};

/**
 * ProviderUserThread Model
 */
class ProviderUserThread extends BaseModel {
  public static table: string = Table.PROVIDER_USER_THREADS;

  /**
   * Fetch by contact id.
   *
   * @param contactId number
   * @param filter object
   */
  static async fetchByContactId(
    schema: string,
    contactId: number,
    providerUserInfo: any,
    pageParams: { pageSize: number; page: number },
    filter?: any
  ) {
    const offset = (pageParams.page - 1) * pageParams.pageSize;

    const qb = super
      .getConnection()
      .from(
        (
          await this.fetchOriginalThreads(schema, contactId, providerUserInfo)
        ).queryBuilder.as('origin_messages')
      )
      .select(
        `id`,
        `subject`,
        `snippet`,
        `attachment_count`,
        `last_updated_datetime`,
        `emails`,
        `sender_receiver_emails`,
        `provider_user_id`
      )
      .where(`original_message_number`, 1)
      .where((builder: Knex.QueryBuilder) => {
        if ('secondarySearch' in filter && filter.secondarySearch != '') {
          builder
            .where(
              `sender_receiver_emails`,
              'ilike',
              `%${filter.secondarySearch}%`
            )
            .orWhere(`subject`, 'ilike', `%${filter.secondarySearch}%`);
        }
      })
      .orderBy('last_updated_datetime', 'desc')
      .offset(offset)
      .limit(pageParams.pageSize);
    return qb;
  }

  /**
   * Fetch threads user id and apply filters, pagination and sort.
   *
   * @param userId number
   * @param filter object
   */
  static fetchByUserId(
    schema: string,
    userId: number,
    pageParams: { pageSize: number; page: number },
    searchParam: any,
    dateRange?: { emailsFrom?: Date; emailsUpto?: Date },
    hasAttachments?: string,
    sortParams?: { field?: string; direction?: string },
    hasClientResponses?: string
  ) {
    const offset = (pageParams.page - 1) * pageParams.pageSize;
    const qb = super
      .getConnection()
      .from(
        this.fetchThreadsByUserId(schema, userId, { hasClientResponses }).as(
          'user_threads'
        )
      )
      .select(
        `thread_id as id`,
        `subject`,
        `snippet`,
        `attachment_count`,
        `emails`,
        `last_updated_datetime`,
        `sender_receiver_emails`
      )
      .where(`row_number`, 1);
    const filteredQb = this.getFilteredThreadsQuery(qb, {
      searchParam,
      dateRange,
      hasAttachments
    });

    if (pageParams.pageSize) {
      filteredQb.offset(offset).limit(pageParams.pageSize);
    }

    if (sortParams?.field) {
      if (sortParams.field == emailOrderFields.ATTACTHMENT_COUNT)
        filteredQb.orderBy(
          'attachment_count',
          sortParams.direction || emailOrderDirections.DESC
        );
      if (sortParams.field == emailOrderFields.LAST_UPDATED_DATE_TIME) {
        filteredQb.orderBy(
          'last_updated_datetime',
          sortParams.direction || emailOrderDirections.DESC
        );
      }
    }

    if (sortParams?.direction) {
      filteredQb.orderBy(
        'last_updated_datetime',
        sortParams.direction || emailOrderDirections.DESC
      );
    }

    return filteredQb;
  }

  /**
   * Fetch original threads by original_message_id.
   *
   * @param schema
   * @param contactId
   */
  static async fetchOriginalThreads(
    schema: string,
    contactId: number,
    providerUserInfo: any
  ) {
    const qb = super
      .getConnection()
      .from(
        (
          await this.fetchThreadsByContactId(
            schema,
            contactId,
            providerUserInfo
          )
        ).query.as('threads')
      )
      .select(
        `*`,
        super.getConnection().raw(
          `ROW_NUMBER() OVER (
          PARTITION BY original_message_id
          ORDER BY last_updated_datetime ASC
        ) AS original_message_number`
        )
      )
      .where(`row_number`, 1);

    return { queryBuilder: qb };
  }

  /**
   * Fetch threads by contact id
   *
   * @param contactId
   */
  static async fetchThreadsByContactId(
    schema: string,
    contactId: number,
    providerUserInfo: any
  ) {
    const qb = super
      .queryBuilder()(Table.THREAD_MESSAGES)
      .withSchema(schema)
      .select(
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id as id`,
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sp_original_message_id as original_message_id`,
        `${Table.MESSAGE_PARTS}.part_from`,
        `${Table.MESSAGE_PARTS}.part_to`,
        `${Table.MESSAGE_PARTS}.cc`,
        `${Table.MESSAGE_PARTS}.bcc`,
        `${Table.PROVIDER_USERS}.id as provider_user_id`,
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.message_datetime`,
        this.rawQueryToGetEmails(schema, contactId),
        super.getConnection().raw(`
        CONCAT_WS(',',  ${Table.MESSAGE_PARTS}.part_to,
        ${Table.MESSAGE_PARTS}.cc, ${Table.MESSAGE_PARTS}.part_from, ${Table.MESSAGE_PARTS}.bcc) as sender_receiver_emails`),
        this.getLatestDateTimeByThreadMessageIdSubQuery(
          schema,
          `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`
        ).as('last_updated_datetime'),
        MessagePart.getAttachmentCountByThreadIdSubQuery(
          schema,
          `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`
        ).as('attachment_count'),
        super.getConnection().raw(
          `ROW_NUMBER() OVER (
            PARTITION BY ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id
            ORDER BY
              CASE WHEN ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.header_type = '${HeaderType.FROM}' THEN 1
                WHEN ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.header_type = '${HeaderType.TO}' THEN 2 END,
              ${Table.MESSAGE_PARTS}.part_datetime ASC
          ) AS row_number`
        )
      );

    this.getDecodedSubject(qb);
    this.getDecodedSnippet(qb);

    qb.join(
      Table.USER_SENDER_RECEIVER_ASSOCIATION,
      `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.thread_message_id`,
      '=',
      `${schema}.${Table.THREAD_MESSAGES}.id`
    )
      .join(
        Table.MESSAGE_PARTS,
        `${Table.MESSAGE_PARTS}.id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.message_part_id`
      )
      .leftJoin(
        Table.PROVIDER_USERS,
        `${Table.PROVIDER_USERS}.id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_id`
      )
      .whereIn(
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`,
        UserSenderReceiverAssociation.fetchThreadIdsByContactId(
          schema,
          contactId
        )
      )
      .where(`${Table.MESSAGE_PARTS}.is_root_part`, true)
      .orderBy('last_updated_datetime', 'desc');

    if (providerUserInfo.length > 0) {
      const providerUserIds = _.map(providerUserInfo, 'providerUserId');
      qb.whereIn(`${Table.PROVIDER_USERS}.id`, providerUserIds);

      const accessTimeRangeRawQuery = this.buildAccessTimeRangeRawQuery(
        providerUserInfo
      );

      qb.whereRaw(accessTimeRangeRawQuery);
    }

    const newQb = (
      await filterByEmailAccessStartDateQuery(
        qb,
        schema,
        'user_sender_receiver_association'
      )
    ).queryBuilder;

    return { query: newQb };
  }

  static getDecodedSnippet(qb: Knex.QueryBuilder) {
    qb.select(
      super
        .getConnection()

        .raw(
          `convert_from(decode(${super
            .getConnection()
            .ref(
              `${Table.THREAD_MESSAGES}.snippet`
            )}, 'base64'), 'UTF8') as snippet`
        )
    );
  }

  static getDecodedSubject(qb: Knex.QueryBuilder) {
    qb.select(
      super
        .getConnection()
        .raw(
          `convert_from(decode(${super
            .getConnection()
            .ref(
              `${Table.MESSAGE_PARTS}.subject`
            )}, 'base64'), 'UTF8') as subject`
        )
    );
  }

  /**
   *
   * @param providerUserInfo Builds a string query for the case when statement when access timeframe is different for each user
   * @returns String
   */
  static buildAccessTimeRangeRawQuery(providerUserInfo: any) {
    let emailsFromWhenStatement = ``;
    let emailsToWhenStatement = ``;

    providerUserInfo.forEach((providerUser: any) => {
      if (providerUser.emailsFrom && providerUser.emailsTo) {
        emailsFromWhenStatement = emailsFromWhenStatement.concat(
          ' ',
          `WHEN ${Table.PROVIDER_USERS}.id = ${providerUser.providerUserId} THEN 
            TO_TIMESTAMP('${providerUser.emailsFrom}', '${DEFAULT_DATE_TIME_FORMAT}')`
        );
        emailsToWhenStatement = emailsToWhenStatement.concat(
          ' ',
          `WHEN ${Table.PROVIDER_USERS}.id = ${providerUser.providerUserId} THEN 
            TO_TIMESTAMP('${providerUser.emailsTo}', '${DEFAULT_DATE_TIME_FORMAT}')`
        );
      }
    });

    let accessTimeRangeRawQuery = '';
    if (emailsFromWhenStatement && emailsToWhenStatement) {
      accessTimeRangeRawQuery = `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.message_datetime >= 
        (CASE ${emailsFromWhenStatement} END)
          AND
        ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.message_datetime <= 
        (CASE ${emailsToWhenStatement} END)`;
    }

    return accessTimeRangeRawQuery;
  }

  /**
   * Fetch threads by user id
   *
   * @param userId
   */
  static fetchThreadsByUserId(
    schema: string,
    userId: number,
    filters: {
      searchParam?: any;
      dateRange?: { emailsFrom?: Date; emailsUpto?: Date };
      hasAttachments?: string;
      hasClientResponses?: string;
    }
  ) {
    const { hasClientResponses } = filters;

    const qb = super
      .queryBuilder()(Table.THREAD_MESSAGES)
      .withSchema(schema)
      .select(
        `${Table.THREAD_MESSAGES}.thread_id`,
        `${Table.MESSAGE_PARTS}.part_from as emails`,
        `${Table.THREAD_MESSAGES}.message_datetime as last_updated_datetime`,
        MessagePart.getAttachmentCountByThreadIdSubQuery(
          schema,
          `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`
        ).as('attachment_count'),
        super.getConnection().raw(`
          CONCAT_WS(',',  ${Table.MESSAGE_PARTS}.part_to,
          ${Table.MESSAGE_PARTS}.cc, ${Table.MESSAGE_PARTS}.part_from, ${Table.MESSAGE_PARTS}.bcc) as sender_receiver_emails`),
        super.getConnection().raw(
          `ROW_NUMBER() OVER (
              PARTITION BY ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id
              ORDER BY
                ${Table.MESSAGE_PARTS}.part_datetime DESC
            ) AS row_number`
        )
      );
    this.getDecodedSubject(qb);
    this.getDecodedSnippet(qb);

    qb.join(
      Table.USER_SENDER_RECEIVER_ASSOCIATION,
      `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.thread_message_id`,
      '=',
      `${schema}.${Table.THREAD_MESSAGES}.id`
    )
      .join(
        Table.MESSAGE_PARTS,
        `${Table.MESSAGE_PARTS}.id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.message_part_id`
      )

      .join(
        Table.CLIENT_DOMAIN_CONTACTS,
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_id`,
        '=',
        `${Table.CLIENT_DOMAIN_CONTACTS}.id`
      )
      .join(
        Table.PROVIDER_USER_THREADS,
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`,
        '=',
        `${Table.PROVIDER_USER_THREADS}.id`
      )
      .where(`${Table.PROVIDER_USER_THREADS}.provider_user_id`, userId)
      .where(`${Table.MESSAGE_PARTS}.is_root_part`, true);

    if (hasClientResponses && hasClientResponses === 'true') {
      qb.whereRaw(this.filterHasClientReplyRawStatement());
    }
    if (hasClientResponses && hasClientResponses === 'false') {
      qb.whereRaw(`not ${this.filterHasClientReplyRawStatement()}`);
    }

    qb.orderBy(`${Table.THREAD_MESSAGES}.message_datetime`, 'desc');
    return qb;
  }

  /**
   * Returns raw exists query to check if client reply exists
   *
   * @param schema
   * @param userId
   */
  static filterHasClientReplyRawStatement() {
    return `exists (
            SELECT * FROM lftechnology.user_sender_receiver_association usra
            WHERE
                usra.sender_receiver_user_type = 'CLIENT_DOMAIN_CONTACT'
                AND usra.provider_user_thread_id =  "thread_messages"."thread_id"
                AND usra.header_type = 'from'
        )`;
  }

  /**
   * Fetches threads by userId
   *
   * @param userId
   */
  static fetchThreadsWithoutPagination(schema: string, userId: number) {
    const qb = super
      .queryBuilder()(Table.THREAD_MESSAGES)
      .withSchema(schema)
      .select(
        `${this.table}.id as thread_id`,
        super.getConnection().raw(`
          CONCAT_WS(',',  ${Table.MESSAGE_PARTS}.part_to,
          ${Table.MESSAGE_PARTS}.cc, ${Table.MESSAGE_PARTS}.part_from, ${Table.MESSAGE_PARTS}.bcc) as sender_receiver_emails`)
      )
      .join(
        Table.USER_SENDER_RECEIVER_ASSOCIATION,
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.thread_message_id`,
        '=',
        `${schema}.${Table.THREAD_MESSAGES}.id`
      )
      .join(
        Table.MESSAGE_PARTS,
        `${Table.MESSAGE_PARTS}.id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.message_part_id`
      )

      .join(
        Table.CLIENT_DOMAIN_CONTACTS,
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_id`,
        '=',
        `${Table.CLIENT_DOMAIN_CONTACTS}.id`
      )
      .join(
        Table.PROVIDER_USER_THREADS,
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`,
        '=',
        `${Table.PROVIDER_USER_THREADS}.id`
      )
      .where(`${Table.PROVIDER_USER_THREADS}.provider_user_id`, userId)
      .where(`${Table.MESSAGE_PARTS}.is_root_part`, true);

    return qb;
  }

  /**
   * Fetch thread ids of a user with given user id.
   *
   * @param userId
   */
  static fetchThreadIdsByUserId(schema: string, userId: number) {
    const queryBuilder = super
      .queryBuilder()(Table.PROVIDER_USER_THREADS)
      .withSchema(schema)
      .select('id')
      .where(`${this.table}.provider_user_id`, userId);

    return queryBuilder;
  }

  /**
   * Raw query to get participant emails.
   *
   * @param contactId
   */
  static rawQueryToGetEmails(schema: string, contactId: number) {
    const contactQuery = Contact.getContactCountByEmailAndId(
      schema,
      contactId,
      super.getConnection().ref(`${Table.MESSAGE_PARTS}.part_from`)
    ).toQuery();
    return super.getConnection().raw(`
      (CASE
        WHEN ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.header_type = '${HeaderType.FROM}' 
        AND (${contactQuery}) = 0 
          THEN ${Table.MESSAGE_PARTS}.part_from
        ELSE 
          CONCAT_WS(',', 
            ${Table.MESSAGE_PARTS}.part_to, 
            ${Table.MESSAGE_PARTS}.cc, 
            ${Table.MESSAGE_PARTS}.bcc
          )
      END) as emails
    `);
  }

  /**
   * get latest date time by thread message id.
   *
   * @param column string
   */
  static getLatestDateTimeByThreadMessageIdSubQuery(
    schema: string,
    column: string
  ) {
    const queryBuilder = super
      .queryBuilder()(Table.THREAD_MESSAGES)
      .withSchema(schema)
      .where(
        `${Table.THREAD_MESSAGES}.thread_id`,
        super.getConnection().ref(column)
      )
      .max(`${Table.THREAD_MESSAGES}.message_datetime`);

    return queryBuilder;
  }

  /**
   * Total count of contacts with filter.
   *
   * @param filter
   */
  static async countWithFilter(
    schema: string,
    contactId: number,
    providerUserIds: any,
    filter?: any
  ) {
    const queryBuilder = super
      .getConnection()
      .from(
        (
          await this.fetchThreadsByContactId(schema, contactId, providerUserIds)
        ).query.as('threads')
      )
      .where('row_number', 1)
      .where((builder: Knex.QueryBuilder) => {
        if ('secondarySearch' in filter && filter.secondarySearch != '') {
          builder
            .where('part_from', 'ilike', `%${filter.secondarySearch}%`)
            .orWhere('part_to', 'ilike', `%${filter.secondarySearch}%`)
            .orWhere('bcc', 'ilike', `%${filter.secondarySearch}%`)
            .orWhere('cc', 'ilike', `%${filter.secondarySearch}%`);
        }
      })
      .countDistinct(`original_message_id`)
      .first();

    return queryBuilder;
  }

  /**
   * Returns count of threads of a particular user with filter.
   *
   * @param filter
   */
  static fetchTotalThreadsCountWithFilter(
    schema: string,
    userId: number,
    searchParam?: any,
    dateRange?: { emailsFrom?: Date; emailsUpto?: Date },
    hasAttachments?: string,
    hasClientResponses?: string
  ) {
    const queryBuilder = super
      .getConnection()
      .from(
        this.fetchThreadsByUserId(schema, userId, { hasClientResponses }).as(
          'threads'
        )
      )
      .where('row_number', 1);
    const filteredQueryBuilder = this.getFilteredThreadsQuery(queryBuilder, {
      searchParam,
      dateRange,
      hasAttachments
    });

    return filteredQueryBuilder.count().first();
  }

  /**
   * Returns total count of threads of a particular user with filter.
   *
   * @param filter
   */
  static fetchTotalThreadCountWithoutFilter(schema: string, userId: number) {
    let queryBuilder = super
      .getConnection()
      .from(this.fetchThreadsWithoutPagination(schema, userId).as('threads'));

    queryBuilder = this.getValidThreadsQuery(
      queryBuilder,
      'sender_receiver_emails'
    );

    return queryBuilder.countDistinct('thread_id').first();
  }

  /**
   * Returns filtered query builder.
   *
   * @param qb
   * @param filters
   */
  static getFilteredThreadsQuery(
    queryBuilder: Knex.QueryBuilder,
    filters: {
      searchParam?: any;
      dateRange?: { emailsFrom?: Date; emailsUpto?: Date };
      hasAttachments?: string;
    }
  ): Knex.QueryBuilder {
    const { searchParam, dateRange, hasAttachments } = filters;
    queryBuilder.where((builder: Knex.QueryBuilder) => {
      if (
        'secondarySearch' in searchParam &&
        searchParam.secondarySearch != ''
      ) {
        builder
          .where(
            `sender_receiver_emails`,
            'ilike',
            `%${searchParam.secondarySearch}%`
          )
          .orWhere(`subject`, 'ilike', `%${searchParam.secondarySearch}%`);
      }
    });
    if (dateRange?.emailsFrom) {
      queryBuilder.where(`last_updated_datetime`, '>=', dateRange.emailsFrom);
    }
    if (dateRange?.emailsUpto) {
      queryBuilder.where(`last_updated_datetime`, '<=', dateRange.emailsUpto);
    }

    if (hasAttachments && hasAttachments === 'false') {
      queryBuilder.where('attachment_count', '=', 0);
    }

    if (hasAttachments && hasAttachments === 'true')
      queryBuilder.where('attachment_count', '>=', 1);

    queryBuilder = this.getValidThreadsQuery(
      queryBuilder,
      'sender_receiver_emails'
    );

    return queryBuilder;
  }

  /**
   * Returns a query builder after filtering do-not-reply emails and emails with invalid domains
   *
   * @param queryBuilder Knex.QueryBuilder
   * @param filterOn string Field on which test is done
   *
   * @returns Knex.QueryBuilder
   */
  static getValidThreadsQuery(
    queryBuilder: Knex.QueryBuilder,
    filterOn: string
  ) {
    PROVIDER_DOMAIN_LIST.forEach((str) => {
      queryBuilder.whereNot(`${filterOn}`, 'ilike', `%${str}%`);
    });
    queryBuilder.whereRaw(`${filterOn} !~ ?`, DO_NOT_REPLY_REGEX);
    return queryBuilder;
  }

  /**
   * Fetch client domain ids by provider user id.
   *
   * @param providerUserThreadId number
   */
  static fetchClientDomainIdsById(
    schema: string,
    providerUserThreadId: number
  ) {
    const queryBuilder = super
      .queryBuilder()(Table.PROVIDER_USER_THREADS)
      .withSchema(schema)
      .select(`${Table.USER_SENDER_RECEIVER_ASSOCIATION}.client_domain_id`)
      .join(
        Table.USER_SENDER_RECEIVER_ASSOCIATION,
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`,
        '=',
        `${Table.PROVIDER_USER_THREADS}.id`
      )
      .where(
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_type`,
        SenderReceiverUserType.CLIENT_DOMAIN_CONTACT
      )
      .where(`${Table.PROVIDER_USER_THREADS}.id`, providerUserThreadId)
      .groupBy(`${Table.USER_SENDER_RECEIVER_ASSOCIATION}.client_domain_id`)
      .pluck(`${Table.USER_SENDER_RECEIVER_ASSOCIATION}.client_domain_id`);

    return queryBuilder;
  }
}

export default ProviderUserThread;
