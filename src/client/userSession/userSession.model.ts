import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import { Transaction } from 'knex';
/**
 * User Session Model
 */
class UserSession extends BaseModel {
  public static table: string = Table.SESSION;

  /**
   * Update record
   * @param schema string
   * @param searchParams param
   * @param updateParams object
   */
  public static updateUserSession(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.SESSION)
      .withSchema(schema)
      .update(updateParams)
      .where(searchParams)
      .returning('*');
    return qb;
  }

  /**
   * Insert into client domain
   */
  public static create(schema: string, data: any, trx?: Transaction) {
    return super
      .queryBuilder(trx)
      .withSchema(schema)
      .insert(data)
      .into(Table.SESSION)
      .returning('*');
  }
}

export default UserSession;
