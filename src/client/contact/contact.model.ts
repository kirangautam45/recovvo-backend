import { Transaction } from 'knex';

import {
  contactFilter,
  SEARCH_PARAMS,
  SECONDARY_SEARCH
} from './filter/contact.filter';
import BaseModel from '../baseModel';
import { contactSort } from './contact.sort';
import Table from '../common/enums/table.enum';
import ProviderUserThread from '../../client/providerUserThread/providerUserThread.model';
import IVisibleProvidersInfo from '../../client/messagePart/interfaces/visibleProvidersInfo.interface';
import UserSenderReceiverAssociation from '../userSenderReceiverAssociation/userSenderReceiverAssociation.model';
/**
 * Contact Model
 */
class Contact extends BaseModel {
  public static table: string = Table.CLIENT_DOMAIN_CONTACTS;

  /**
   * Fetch list of filtered contacts.
   *
   * @param pageParams object
   * @param filter object
   */
  static async fetchWithFilter(
    schema: string,
    sortParams: { field: string; direction: string },
    visibleProvidersInfos: {
      data: IVisibleProvidersInfo[];
      contactId: number;
    }[],
    filter?: any
  ) {
    let queryBuilder = super
      .queryBuilder()(Table.CLIENT_DOMAIN_CONTACTS)
      .withSchema(schema)
      .select(
        Table.CLIENT_DOMAIN_CONTACTS + '.id',
        Table.CLIENT_DOMAIN_CONTACTS + '.first_name',
        Table.CLIENT_DOMAIN_CONTACTS + '.last_name',
        Table.CLIENT_DOMAIN_CONTACTS + '.email',
        Table.CLIENT_DOMAIN_CONTACTS + '.contact_organization_name',
        Table.CLIENT_DOMAINS + '.domain',
        (
          await UserSenderReceiverAssociation.contactAttachmentCountSubQuery(
            schema,
            visibleProvidersInfos
          )
        ).queryBuilder.as('totalAttachmentCount'),
        UserSenderReceiverAssociation.lastContactDateSubQuery(
          schema,
          visibleProvidersInfos
        ).as('lastContactDate'),
        (
          await UserSenderReceiverAssociation.totalContactCountSubQuery(
            schema,
            visibleProvidersInfos
          )
        ).query.as('totalContactCount'),
        (
          await UserSenderReceiverAssociation.totalReplyCountSubQuery(
            schema,
            visibleProvidersInfos
          )
        ).queryBuilder.as('totalReplyCount')
      )
      .join(
        Table.CLIENT_DOMAINS,
        Table.CLIENT_DOMAINS + '.id',
        '=',
        Table.CLIENT_DOMAIN_CONTACTS + '.client_domain_id'
      );

    queryBuilder = ProviderUserThread.getValidThreadsQuery(
      queryBuilder,
      'email'
    );

    if (filter) {
      queryBuilder = (
        await contactFilter(schema, queryBuilder, filter, [
          ...SEARCH_PARAMS,
          SECONDARY_SEARCH
        ])
      ).queryBuilder;
    }

    queryBuilder = contactSort(queryBuilder, sortParams);

    return { queryBuilder: queryBuilder };
  }

  /**
   * Fetch list of filtered contacts with paginate.
   *
   * @param pageParams
   * @param sortParams
   * @param filter
   */
  static async findWithFilterAndPage(
    schema: string,
    pageParams: { page: number; pageSize: number },
    sortParams: { field: string; direction: string },
    visibleProvidersInfos: {
      data: IVisibleProvidersInfo[];
      contactId: number;
    }[],
    filter?: any
  ) {
    const offset = (pageParams.page - 1) * pageParams.pageSize;
    const contacts = (
      await this.fetchWithFilter(
        schema,
        sortParams,
        visibleProvidersInfos,
        filter
      )
    ).queryBuilder;

    contacts.offset(offset).limit(pageParams.pageSize);
    return contacts;
  }

  /**
   * Total count of contacts with filter.
   *
   * @param filter
   */
  static async countWithFilter(schema: string, filter?: any) {
    let queryBuilder = super
      .queryBuilder()(Table.CLIENT_DOMAIN_CONTACTS)
      .withSchema(schema)
      .join(
        Table.CLIENT_DOMAINS,
        Table.CLIENT_DOMAINS + '.id',
        '=',
        Table.CLIENT_DOMAIN_CONTACTS + '.client_domain_id'
      );

    queryBuilder = ProviderUserThread.getValidThreadsQuery(
      queryBuilder,
      'email'
    );

    if (filter) {
      queryBuilder = (
        await contactFilter(schema, queryBuilder, filter, [
          ...SEARCH_PARAMS,
          SECONDARY_SEARCH
        ])
      ).queryBuilder;
    }

    queryBuilder.count().first();

    return queryBuilder;
  }

  /**
   * Find contacts by emails.
   *
   * @param emails
   */
  static findByEmailIn(schema: string, emails: any[]) {
    const contacts = super
      .queryBuilder()(Table.CLIENT_DOMAIN_CONTACTS)
      .withSchema(schema)
      .whereIn('email', emails);

    return contacts;
  }

  /**
   * Finds contacts with given client domain ids.
   *
   * @param schema string
   * @param clientDomainIds number[]
   * @returns
   */
  static findByClientDomainIdsIn(schema: string, clientDomainIds: number[]) {
    const contacts = super
      .queryBuilder()(Table.CLIENT_DOMAIN_CONTACTS)
      .withSchema(schema)
      .whereIn('client_domain_id', clientDomainIds);

    return contacts;
  }

  /**
   * Finds contacts with given ids.
   *
   * @param schema string
   * @param contactIds number[]
   * @returns
   */
  static findByContactIdsIn(schema: string, contactIds: number[]) {
    const contacts = super
      .queryBuilder()(Table.CLIENT_DOMAIN_CONTACTS)
      .withSchema(schema)
      .whereIn('id', contactIds);

    return contacts;
  }

  /**
   * Find by email and id.
   *
   * @param id
   * @param email
   */
  static getContactCountByEmailAndId(schema: string, id: number, email: any) {
    const contacts = super
      .queryBuilder()(Table.CLIENT_DOMAIN_CONTACTS)
      .withSchema(schema)
      .where('id', id)
      .where('email', email)
      .count('*');

    return contacts;
  }

  /**
   * Find first record according to query.
   *
   * @param {number} id
   * @param {callback} callback
   * @param {Knex.Transaction} trx
   * @returns {Knex.QueryBuilder}
   */
  public static findFirstRecord(
    schema: string,
    params: any,
    trx?: Transaction,
    callback?: any
  ) {
    const qb = super
      .queryBuilder(trx)(Table.CLIENT_DOMAIN_CONTACTS)
      .withSchema(schema)
      .where(params)
      .limit(1);

    if (callback) callback(qb);

    return qb.then(([result]: any) => {
      return result;
    });
  }

  /**
   * Update record.
   *
   * @param schema string
   * @param searchParams param
   * @param updateParams object
   */
  public static updateContact(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.CLIENT_DOMAIN_CONTACTS)
      .withSchema(schema)
      .update(updateParams)
      .where(searchParams)
      .returning('*');
    return qb;
  }

  public static findByProviderUserThreadId(
    schema: string,
    id: number,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.USER_SENDER_RECEIVER_ASSOCIATION)
      .withSchema(schema)
      .select('sender_receiver_user_email')
      .where({
        providerUserThreadId: id,
        senderReceiverUserType: 'CLIENT_DOMAIN_CONTACT'
      })
      .distinct();

    return qb.then(([result]: any) => {
      return result;
    });
  }
}

export default Contact;
