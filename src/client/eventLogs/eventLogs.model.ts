import { Transaction } from 'knex';

import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';

class EventLogs extends BaseModel {
  public static table: string = Table.EVENT_LOGS;

  /**
   * Insert into provider users
   */
  public static create(schema: string, data: any, trx?: Transaction) {
    return super
      .queryBuilder(trx)
      .withSchema(schema)
      .insert(data)
      .into(this.table)
      .returning('*');
  }

  /**
   * Fetch all users from database
   *
   * @returns Promise
   */
  public static fetchAll(schema: string, trx?: Transaction): Promise<any> {
    return super.queryBuilder(trx).withSchema(schema).select().from(this.table);
  }
}

export default EventLogs;
