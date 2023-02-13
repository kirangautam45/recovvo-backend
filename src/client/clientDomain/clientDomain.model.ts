import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import Knex, { Transaction } from 'knex';
import ClientDomainUserMapping from './clientDomainUserMapping.model';
import { PROVIDER_DOMAIN_LIST } from '../common/constants/exclusionList';
/**
 * Client Domain Model
 */
class ClientDomain extends BaseModel {
  public static table: string = Table.CLIENT_DOMAINS;

  /**
   * Fetch Filtered client domains as per filter value
   * @param filter any
   */
  static filterClientDomains(schema: string, filter: any) {
    const filteredClientDomains = super
      .queryBuilder()(Table.CLIENT_DOMAINS)
      .withSchema(schema)
      .select()
      .where((builder: Knex.QueryBuilder) => {
        if ('search' in filter && filter.search != '') {
          builder.where(
            Table.CLIENT_DOMAINS + '.domain',
            'like',
            `%${filter.search}%`
          );
        }

        if ('userId' in filter && filter.userId != '') {
          builder.whereNotIn(
            Table.CLIENT_DOMAINS + '.id',
            ClientDomainUserMapping.fetchDomainIdsByProviderUserId(
              schema,
              filter.userId
            )
          );
        }
      })
      .andWhere(Table.CLIENT_DOMAINS + '.is_deleted', '=', false)
      .whereNotIn(Table.CLIENT_DOMAINS + '.domain', PROVIDER_DOMAIN_LIST);

    return filteredClientDomains;
  }

  /**
   * Insert into client domain
   */
  static create(schema: string, data: any, trx?: Transaction) {
    return super
      .queryBuilder(trx)
      .withSchema(schema)
      .insert(data)
      .into(Table.CLIENT_DOMAINS)
      .returning('*');
  }

  /**
   * Find first record according to query
   *
   * @param {number} id
   * @param {callback} callback
   * @param {Knex.Transaction} trx
   * @returns {Knex.QueryBuilder}
   */
  public static async findFirstRecord(
    schema: string,
    params: any,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = super.queryBuilder(trx)(Table.CLIENT_DOMAINS).withSchema(schema);

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

  public static async findById(
    schema: string,
    id: number,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = super.queryBuilder(trx)(Table.CLIENT_DOMAINS).withSchema(schema);

    qb.select('*')
      .where({ id })
      .then(([result]: any) => {
        return result ? result : null;
      });

    if (callback) callback(qb);

    return qb.then(([result]: any) => {
      return result;
    });
  }

  /**
   * Gets the filtered ids of the domains
   * @param schema string
   * @param domains list of domains
   * @param callback callback
   * @param trx Transaction
   * @returns
   */
  public static async findByDomainsIn(
    schema: string,
    domains: string[],
    callback?: any,
    trx?: Transaction
  ) {
    const qb = super.queryBuilder(trx)(Table.CLIENT_DOMAINS).withSchema(schema);

    qb.select('id').whereIn('domain', domains);

    if (callback) callback(qb);

    return qb;
  }

  /**
   * Update record
   * @param schema string
   * @param searchParams param
   * @param updateParams object
   */
  public static updateClientDomain(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.CLIENT_DOMAINS)
      .withSchema(schema)
      .update(updateParams)
      .where(searchParams)
      .returning('*');
    return qb;
  }
}

export default ClientDomain;
