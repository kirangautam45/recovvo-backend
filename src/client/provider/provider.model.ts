import { Transaction } from 'knex';
import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
/**
 * Provider Model
 */
class Provider extends BaseModel {
  public static table: string = Table.PROVIDERS;

  /**
   * Insert into client domain
   */
  static create(schema: string, data: any, trx?: Transaction) {
    return super
      .queryBuilder(trx)
      .withSchema(schema)
      .insert(data)
      .into(Table.PROVIDERS)
      .returning('*');
  }

  /**
   * Update record
   * @param schema string
   * @param searchParams param
   * @param updateParams object
   */
  public static updateProviders(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.PROVIDERS)
      .withSchema(schema)
      .update(updateParams)
      .where(searchParams)
      .returning('*');
    return qb;
  }

  /**
   * Find first record according to query
   *
   * @param {number} id
   * @param {callback} callback
   * @param {Knex.Transaction} trx
   * @returns {Knex.QueryBuilder}
   */
  public static findOne(
    schema: string,
    params: any,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = super.queryBuilder(trx)(this.table).withSchema(schema);

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

export default Provider;
