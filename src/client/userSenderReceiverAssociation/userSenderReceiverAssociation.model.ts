import moment from 'moment';
import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import HeaderType from './enums/headerType.enum';
import MessagePart from '../../client/messagePart/messagePart.model';
import SenderReceiverUserType from './enums/senderReceiverUserType.enum';
import { filterByEmailAccessStartDateQuery } from '../../core/utils/query';
import { DEFAULT_DATE_FORMAT } from '../common/constants/dateTimeConstants';
import { MIME_TYPE_LIST } from '../../client/common/constants/exclusionList';
import ProviderUserThread from '../../client/providerUserThread/providerUserThread.model';
import IVisibleProvidersInfo from '../../client/messagePart/interfaces/visibleProvidersInfo.interface';

/**
 * UserSenderReceiverAssociation Model
 */
class UserSenderReceiverAssociation extends BaseModel {
  public static table: string = Table.USER_SENDER_RECEIVER_ASSOCIATION;

  /**
   * Contact attachment count.
   */
  static async contactAttachmentCountSubQuery(
    schema: string,
    visibleProvidersInfos?: {
      data: IVisibleProvidersInfo[];
      contactId: number;
    }[]
  ) {
    let queryBuilder = super
      .queryBuilder()(Table.USER_SENDER_RECEIVER_ASSOCIATION)
      .withSchema(schema)
      .join(
        Table.PROVIDER_USER_THREADS,
        `${Table.PROVIDER_USER_THREADS}.id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`
      )
      .join(
        Table.PROVIDER_USERS,
        `${Table.PROVIDER_USERS}.id`,
        '=',
        `${Table.PROVIDER_USER_THREADS}.provider_user_id`
      )
      .join(
        Table.MESSAGE_PARTS,
        `${Table.MESSAGE_PARTS}.message_id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.thread_message_id`
      )

      .where(`is_attachment`, true)

      .where(
        `sender_receiver_user_type`,
        SenderReceiverUserType.CLIENT_DOMAIN_CONTACT
      )
      .where(
        `sender_receiver_user_id`,
        super.getConnection().ref(`${Table.CLIENT_DOMAIN_CONTACTS}.id`)
      )

      .whereNotIn('mime_type', MIME_TYPE_LIST);

    if (visibleProvidersInfos) {
      queryBuilder = MessagePart.visibleProviderUsersFilter(
        queryBuilder,
        visibleProvidersInfos
      );
    }

    const qb = (
      await filterByEmailAccessStartDateQuery(
        queryBuilder,
        schema,
        'user_sender_receiver_association'
      )
    ).queryBuilder;

    return {
      queryBuilder: qb.countDistinct([
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sp_original_message_id`,
        `${Table.MESSAGE_PARTS}.sp_part_id`
      ])
    };
  }

  /**
   * Last contact date
   */
  static lastContactDateSubQuery(
    schema: string,
    visibleProvidersInfos?: {
      data: IVisibleProvidersInfo[];
      contactId: number;
    }[]
  ) {
    let queryBuilder = super
      .queryBuilder()(Table.USER_SENDER_RECEIVER_ASSOCIATION)
      .withSchema(schema)
      .join(
        Table.PROVIDER_USER_THREADS,
        `${Table.PROVIDER_USER_THREADS}.id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`
      )
      .join(
        Table.PROVIDER_USERS,
        `${Table.PROVIDER_USERS}.id`,
        '=',
        `${Table.PROVIDER_USER_THREADS}.provider_user_id`
      )
      .join(
        Table.MESSAGE_PARTS,
        `${Table.MESSAGE_PARTS}.message_id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.thread_message_id`
      )
      .where(
        'sender_receiver_user_type',
        SenderReceiverUserType.CLIENT_DOMAIN_CONTACT
      )
      .where(
        'sender_receiver_user_id',
        super.getConnection().ref(`${Table.CLIENT_DOMAIN_CONTACTS}.id`)
      );

    if (visibleProvidersInfos) {
      queryBuilder = MessagePart.visibleProviderUsersFilter(
        queryBuilder,
        visibleProvidersInfos
      );
    }

    return queryBuilder.max('message_datetime');
  }

  /**
   * Total contact count
   */
  static async totalContactCountSubQuery(
    schema: string,
    visibleProvidersInfos: {
      data: IVisibleProvidersInfo[];
      contactId: number;
    }[]
  ) {
    const queryBuilder = super
      .getConnection()
      .from(
        (
          await this.fetchThreadsForContactCount(schema, visibleProvidersInfos)
        ).queryBuilder.as('threads')
      )
      .where('original_message_number', 1);

    return {
      query: queryBuilder.count('*')
    };
  }

  static async fetchThreadsForContactCount(
    schema: string,
    visibleProvidersInfos: {
      data: IVisibleProvidersInfo[];
      contactId: number;
    }[]
  ) {
    const queryBuilder = super
      .getConnection()
      .from(
        (
          await this.fetchOriginalThreads(schema, visibleProvidersInfos)
        ).query.as('original_threads')
      )
      .select(
        '*',
        super.getConnection().raw(
          `ROW_NUMBER() OVER (
          PARTITION BY original_message_id
           ORDER BY
              last_updated_datetime ASC
        ) AS original_message_number`
        )
      )

      .where('row_number', 1);
    return { queryBuilder };
  }

  /**
   * Fetch original thread
   * */
  static async fetchOriginalThreads(
    schema: string,
    visibleProvidersInfos?: {
      data: IVisibleProvidersInfo[];
      contactId: number;
    }[]
  ) {
    let queryBuilder = super
      .queryBuilder()(Table.THREAD_MESSAGES)
      .withSchema(schema)
      .select(
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sp_original_message_id as original_message_id`,
        super.getConnection().raw(
          `ROW_NUMBER() OVER (
          PARTITION BY ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id
          ORDER BY
            CASE
                WHEN user_sender_receiver_association.header_type = 'from' THEN 1
                WHEN user_sender_receiver_association.header_type = 'to' THEN 2
            END,
            message_parts.part_datetime ASC
        ) AS row_number`
        ),
        ProviderUserThread.getLatestDateTimeByThreadMessageIdSubQuery(
          schema,
          `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`
        ).as('last_updated_datetime')
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
      .leftJoin(
        Table.PROVIDER_USERS,
        `${Table.PROVIDER_USERS}.id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_id`
      )
      .whereRaw(
        `"user_sender_receiver_association"."provider_user_thread_id" in (
              select
                  distinct "provider_user_thread_id"
              from
                  "lftechnology"."user_sender_receiver_association"
              where
                  "user_sender_receiver_association"."sender_receiver_user_type" = 'CLIENT_DOMAIN_CONTACT'
                  and "user_sender_receiver_association"."sender_receiver_user_id" = client_domain_contacts.id
          )`
      )
      .where(`${Table.MESSAGE_PARTS}.is_root_part`, true);

    if (visibleProvidersInfos) {
      queryBuilder = MessagePart.visibleProviderUsersFilter(
        queryBuilder,
        visibleProvidersInfos
      );
    }

    const qb = (
      await filterByEmailAccessStartDateQuery(
        queryBuilder,
        schema,
        'user_sender_receiver_association'
      )
    ).queryBuilder;

    return { query: qb };
  }

  /**
   * Total reply contact.
   */
  static async totalReplyCountSubQuery(
    schema: string,
    visibleProvidersInfos?: {
      data: IVisibleProvidersInfo[];
      contactId: number;
    }[]
  ) {
    let queryBuilder = super
      .queryBuilder()(Table.USER_SENDER_RECEIVER_ASSOCIATION)
      .withSchema(schema)
      .join(
        Table.PROVIDER_USER_THREADS,
        `${Table.PROVIDER_USER_THREADS}.id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`
      )
      .join(
        Table.PROVIDER_USERS,
        `${Table.PROVIDER_USERS}.id`,
        '=',
        `${Table.PROVIDER_USER_THREADS}.provider_user_id`
      )
      .join(
        Table.MESSAGE_PARTS,
        `${Table.MESSAGE_PARTS}.message_id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.thread_message_id`
      )
      .where(
        'sender_receiver_user_type',
        SenderReceiverUserType.CLIENT_DOMAIN_CONTACT
      )
      .where(
        'sender_receiver_user_id',
        super.getConnection().ref(`${Table.CLIENT_DOMAIN_CONTACTS}.id`)
      )
      .where('header_type', HeaderType.FROM);

    if (visibleProvidersInfos) {
      queryBuilder = MessagePart.visibleProviderUsersFilter(
        queryBuilder,
        visibleProvidersInfos
      );
    }

    const qb = (
      await filterByEmailAccessStartDateQuery(
        queryBuilder,
        schema,
        'user_sender_receiver_association'
      )
    ).queryBuilder;

    return {
      queryBuilder: qb.countDistinct(
        'user_sender_receiver_association.sp_original_message_id'
      )
    };
  }

  /**
   * Fetch thread ids by contact id.
   *
   * @param contactId
   */
  static fetchThreadIdsByContactId(schema: string, contactId: number) {
    const queryBuilder = super
      .queryBuilder()(Table.USER_SENDER_RECEIVER_ASSOCIATION)
      .withSchema(schema)
      .distinct('provider_user_thread_id')
      .where(
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_type`,
        SenderReceiverUserType.CLIENT_DOMAIN_CONTACT
      )
      .where(
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_id`,
        contactId
      );

    return queryBuilder;
  }

  /**
   * Fetch full name by message id.
   *
   * @param messageId
   */
  static fetchFullNameByMessageId(schema: string, messageId: any) {
    const queryBuilder = super
      .queryBuilder()(Table.USER_SENDER_RECEIVER_ASSOCIATION)
      .withSchema(schema)
      .select(this.rawQueryCaseForFullName())
      .leftJoin(
        Table.PROVIDER_USERS,
        `${Table.PROVIDER_USERS}.id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_id`
      )
      .leftJoin(
        Table.CLIENT_DOMAIN_CONTACTS,
        `${Table.CLIENT_DOMAIN_CONTACTS}.id`,
        '=',
        `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_id`
      )
      .where('header_type', HeaderType.FROM)
      .where('thread_message_id', messageId);

    return queryBuilder;
  }

  /**
   * raw query case for full name.
   */
  static rawQueryCaseForFullName() {
    return super.getConnection().raw(`(
      CASE WHEN
        ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_type='${SenderReceiverUserType.CLIENT_DOMAIN_CONTACT}'
      THEN
        CONCAT_WS(' ',
          ${Table.CLIENT_DOMAIN_CONTACTS}.first_name,
          ${Table.CLIENT_DOMAIN_CONTACTS}.last_name
        )
      WHEN
        ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_type='${SenderReceiverUserType.PROVIDER_USER}'
      THEN
        CONCAT_WS(' ',
          ${Table.PROVIDER_USERS}.first_name,
          ${Table.PROVIDER_USERS}.last_name
        )
      END ) as full_name`);
  }

  static findByOriginalMessageId(schema: string, original_message_id: any) {
    const queryBuilder = super
      .queryBuilder()(Table.USER_SENDER_RECEIVER_ASSOCIATION)
      .withSchema(schema)
      .where('sp_original_message_id', original_message_id)
      .limit(1)
      .select('provider_user_thread_id');

    return queryBuilder;
  }

  /**
   * Returns query to find client domain ids for given user and timeframe
   * @param schema string
   * @param providerUserIds Array[number]
   * @param emailAccessStartDate DateTime
   * @param emailAccessEndDate DateTime
   * @returns Query Builder
   */
  static async findClientDominIdsFromUser(
    schema: string,
    providerUserIds: number[],
    emailAccessStartDate?: any,
    emailAccessEndDate?: any
  ) {
    const historicalStartDate = moment(emailAccessStartDate).format(
      DEFAULT_DATE_FORMAT
    );
    const historicalEndDate = moment(emailAccessEndDate).format(
      DEFAULT_DATE_FORMAT
    );

    const hqb = super
      .queryBuilder()(Table.USER_SENDER_RECEIVER_ASSOCIATION)
      .withSchema(schema)
      .select('thread_message_id')
      .where('sender_receiver_user_type', '=', 'PROVIDER_USER')
      .andWhere('sender_receiver_user_id', 'IN', providerUserIds);

    if (emailAccessStartDate) {
      hqb.where('message_datetime', '>=', historicalStartDate);
    }

    if (emailAccessEndDate) {
      hqb.where('message_datetime', '<=', historicalEndDate);
    }

    const qb = super
      .queryBuilder()(Table.USER_SENDER_RECEIVER_ASSOCIATION)
      .withSchema(schema)
      .select('client_domain_id', 'sender_receiver_user_id')
      .whereIn(`thread_message_id`, hqb)
      .andWhere('sender_receiver_user_type', 'CLIENT_DOMAIN_CONTACT')
      .distinct();

    const newQb = (
      await filterByEmailAccessStartDateQuery(
        qb,
        schema,
        'user_sender_receiver_association'
      )
    ).queryBuilder;

    return newQb;
  }
}

export default UserSenderReceiverAssociation;
