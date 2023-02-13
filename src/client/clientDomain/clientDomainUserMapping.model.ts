import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import Knex, { Transaction } from 'knex';
/**
 * clientDomainUserMapping Model
 */
class clientDomainUserMapping extends BaseModel {
  public static table: string = Table.PROVIDER_USERS_CLIENT_DOMAINS;

  /**
   * Find by id in.
   *
   * @param providerUserIds number[]
   */
  static findByProviderUserIdIn(schema: string, providerUserIds: number[]) {
    const usersClientDomains = super
      .queryBuilder()(Table.PROVIDER_USERS_CLIENT_DOMAINS)
      .withSchema(schema)
      .whereIn('provider_user_id', providerUserIds)
      .andWhere('is_deleted', false);

    return usersClientDomains;
  }

  static fetchDomainIdsByProviderUserId(
    schema: string,
    providerUserId: number
  ) {
    const usersClientDomains = super
      .queryBuilder()(Table.PROVIDER_USERS_CLIENT_DOMAINS)
      .withSchema(schema)
      .where('provider_user_id', providerUserId)
      .andWhere('is_deleted', false)
      .select('client_domain_id');

    return usersClientDomains;
  }

  /**
   * Fetch list of filtered mapped domains.
   *
   * @param query object
   * @param filter object
   */

  static filterMappedDomainsUser(
    schema: string,
    providerUserId: any,
    filter: any
  ) {
    const mappedUserDomains = super
      .queryBuilder()(Table.PROVIDER_USERS_CLIENT_DOMAINS)
      .withSchema(schema)
      .select(
        Table.PROVIDER_USERS_CLIENT_DOMAINS + '.id',
        Table.PROVIDER_USERS_CLIENT_DOMAINS + '.provider_user_id',
        Table.PROVIDER_USERS_CLIENT_DOMAINS + '.client_domain_id',
        Table.PROVIDER_USERS_CLIENT_DOMAINS + '.is_deleted',
        Table.CLIENT_DOMAINS + '.domain'
      )
      .join(
        Table.CLIENT_DOMAINS,
        Table.CLIENT_DOMAINS + '.id',
        '=',
        Table.PROVIDER_USERS_CLIENT_DOMAINS + '.client_domain_id'
      )
      .where((builder: Knex.QueryBuilder) => {
        if ('search' in filter && filter.search != '') {
          builder.where(
            Table.CLIENT_DOMAINS + '.domain',
            'like',
            `%${filter.search}%`
          );
        }
      })
      .andWhere(
        Table.PROVIDER_USERS_CLIENT_DOMAINS + '.provider_user_id',
        '=',
        providerUserId
      )
      .andWhere(
        Table.PROVIDER_USERS_CLIENT_DOMAINS + '.is_deleted',
        '=',
        false
      );
    return mappedUserDomains;
  }

  /**
   * Find first record according to query
   *
   * @param {number} id
   * @param {callback} callback
   * @param {Knex.Transaction} trx
   * @returns {Knex.QueryBuilder}
   */
  public static findFirstRecord(
    schema: string,
    params: any,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.PROVIDER_USERS_CLIENT_DOMAINS)
      .withSchema(schema);

    qb.select('*')
      .where(params)
      .limit(1)
      .then(([result]: any) => {
        return result ? result : null;
      });

    if (callback) callback(qb);

    return qb.then(([result]: any) => {
      return result;
    });
  }

  /**
   * Update record
   * @param schema string
   * @param searchParams param
   * @param updateParams object
   */
  public static updateMapping(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.PROVIDER_USERS_CLIENT_DOMAINS)
      .withSchema(schema)
      .update(updateParams)
      .where(searchParams)
      .returning('*');
    return qb;
  }

  /**
   * Insert into client domain
   */
  static create(schema: string, data: any, trx?: Transaction) {
    return super
      .queryBuilder(trx)
      .withSchema(schema)
      .insert(data)
      .into(Table.PROVIDER_USERS_CLIENT_DOMAINS)
      .returning('*');
  }
}

export default clientDomainUserMapping;
