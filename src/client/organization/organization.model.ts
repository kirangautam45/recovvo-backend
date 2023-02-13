import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import { Transaction } from 'knex';

/**
 * Organization Model
 */
class Organization extends BaseModel {
  public static table: string = Table.ORGANIZATION;
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
    const qb = super.queryBuilder(trx)(Table.ORGANIZATION).withSchema(schema);
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
  public static updateOrganization(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.ORGANIZATION)
      .withSchema(schema)
      .update(updateParams)
      .where(searchParams)
      .returning('*');
    return qb;
  }
}

export default Organization;
