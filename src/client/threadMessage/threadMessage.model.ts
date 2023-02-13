import { Transaction } from 'knex';
import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import HeaderType from '../userSenderReceiverAssociation/enums/headerType.enum';
import SenderReceiverUserType from '../userSenderReceiverAssociation/enums/senderReceiverUserType.enum';
import MessagePart from '../messagePart/messagePart.model';

/**
 * ThreadMessage Model
 */
class ThreadMessage extends BaseModel {
  public static table: string = Table.THREAD_MESSAGES;

  /**
   * Fetch by thread id.
   *
   * @param threadId number
   */

  static fetchByThreadId(schema: string, threadId: number) {
    const MESSAGES = 'messages';
    const threadMessages = super
      .getConnection()
      .from(
        super
          .queryBuilder()(Table.USER_SENDER_RECEIVER_ASSOCIATION)
          .withSchema(schema)
          .select(
            `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.thread_message_id as id`,
            `${Table.MESSAGE_PARTS}.subject`,
            `${Table.MESSAGE_PARTS}.part_from`,
            `${Table.MESSAGE_PARTS}.part_to`,
            `${Table.MESSAGE_PARTS}.cc`,
            `${Table.MESSAGE_PARTS}.bcc`,
            `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.message_datetime`,
            `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.header_type`,
            `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sp_original_message_id`,
            this.rawQueryToGetEmails(),
            this.rawQueryCaseForUser('first_name'),
            this.rawQueryCaseForUser('last_name'),
            this.rawQueryCaseForUser('email'),
            super.getConnection().raw(
              `ROW_NUMBER() OVER (
                PARTITION BY ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.thread_message_id
                ORDER BY 
                  CASE WHEN ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.header_type = '${HeaderType.FROM}' THEN 1 
                    WHEN ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.header_type = '${HeaderType.TO}' THEN 2
                  END ASC
              ) AS row_number`
            )
          )
          .join(
            Table.MESSAGE_PARTS,
            `${Table.MESSAGE_PARTS}.message_id`,
            '=',
            `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.thread_message_id`
          )
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
          .where(
            `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.provider_user_thread_id`,
            threadId
          )
          .where(`${Table.MESSAGE_PARTS}.is_root_part`, true)
          .andWhereNot(`${Table.MESSAGE_PARTS}.mime_type`, 'multipart/report')
          .as(MESSAGES)
      )
      .select(
        `${MESSAGES}.*`,
        MessagePart.fetchBodyDataByMessageId(
          schema,
          super.getConnection().ref(`${MESSAGES}.id`)
        ).as('body_data')
      )
      .where(`${MESSAGES}.row_number`, 1)
      .orderBy(`${MESSAGES}.message_datetime`, 'desc');

    return threadMessages;
  }

  /**
   * Update thread message
   * @param schema string
   * @param searchParams object
   * @param updateParams object
   */
  public static updateThreadMessageById(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.THREAD_MESSAGES)
      .withSchema(schema)
      .update(updateParams)
      .where(searchParams)
      .returning('*');

    return qb;
  }

  /**
   * Raw query to get emails.
   */
  static rawQueryToGetEmails() {
    return super.getConnection().raw(`
      CONCAT_WS(',', 
        ${Table.MESSAGE_PARTS}.part_from, 
        ${Table.MESSAGE_PARTS}.part_to, 
        ${Table.MESSAGE_PARTS}.cc, 
        ${Table.MESSAGE_PARTS}.bcc
      ) as participant_emails
    `);
  }

  /**
   * get raw query for user using sender_receiver_user_type case.
   *
   * @param column
   */
  static rawQueryCaseForUser(column: string) {
    return super.getConnection().raw(`(
      CASE WHEN 
        ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_type='${SenderReceiverUserType.CLIENT_DOMAIN_CONTACT}'
      THEN 
        ${Table.CLIENT_DOMAIN_CONTACTS}.${column}
      WHEN 
        ${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_type='${SenderReceiverUserType.PROVIDER_USER}'
      THEN 
        ${Table.PROVIDER_USERS}.${column}
      END ) as ${column}`);
  }
}

export default ThreadMessage;
