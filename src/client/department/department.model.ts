import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import { Transaction } from 'knex';

/**
 * Department Model
 */
class Department extends BaseModel {
  public static table: string = Table.DEPARTMENTS;
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
    const qb = super.queryBuilder(trx)(Table.DEPARTMENTS).withSchema(schema);

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
}

export default Department;
