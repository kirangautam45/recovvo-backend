import Knex, { Transaction } from 'knex';

import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import { filterWithEmailOrNameQuery } from '../../core/utils/query';

/**
 * UserSupervisor Model
 */
class UserSupervisor extends BaseModel {
  public static table: string = Table.PROVIDER_USERS_SUPERVISORS;

  /**
   * Update record
   * @param schema string
   * @param searchParams param
   * @param updateParams object
   */
  public static updateUserSupervisor(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.PROVIDER_USERS_SUPERVISORS)
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
      .into(Table.PROVIDER_USERS_SUPERVISORS)
      .returning('*');
  }

  public static findBySupervisorIds(
    schema: string,
    supervisorIds: number[],
    trx?: Transaction
  ) {
    return super
      .queryBuilder(trx)(Table.PROVIDER_USERS_SUPERVISORS)
      .withSchema(schema)
      .select('*')
      .whereIn('supervisor_id', supervisorIds)
      .andWhere('is_deleted', false);
  }

  /**
   * Gets subordinates of supervisors with given supervisorId and filters the subordinates with searchquery.
   *
   * @param {String} schema
   * @param {Number} userId
   * @param {string} searchParam
   * @param trx transaction
   */
  public static findSubordinatesWithSearchParams(
    schema: string,
    supervisorId: number | undefined,
    searchParam: string,
    trx?: Transaction
  ): Knex.QueryBuilder {
    const qb = super
      .queryBuilder(trx)(this.table)
      .withSchema(schema)
      .select(
        `${schema}.${this.table}.user_id`,
        `${schema}.${this.table}.supervisor_id`,
        super
          .getConnection()
          .raw(
            `CONCAT(subordinate_detail.first_name, ' ', subordinate_detail.last_name) as full_name`
          ),
        `subordinate_detail.email`
      )
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.PROVIDER_USERS} as subordinate_detail ON subordinate_detail.id = user_id`
      )
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.PROVIDER_USERS} as supervisor_detail ON supervisor_detail.id = supervisor_id`
      )
      .where(`${schema}.${this.table}.supervisor_id`, supervisorId)
      .andWhere('supervisor_detail.isSupervisor', true)
      .andWhere(`${schema}.${this.table}.is_deleted`, false)
      .andWhere((builder: Knex.QueryBuilder) => {
        filterWithEmailOrNameQuery(builder, searchParam, 'subordinate_detail');
      })
      .orderByRaw(
        'CASE WHEN (subordinate_detail.first_name IS NOT NULL) THEN subordinate_detail.first_name ELSE subordinate_detail.email END'
      );

    return qb;
  }

  /**
   * Gets total count of subordinates of supervisors with given supervisorId.
   *
   * @param {String} schema
   * @param {Number} userId
   * @param trx transaction
   */
  public static getTotalCountOfSubordinates(
    schema: string,
    supervisorId: number | undefined,
    trx?: Transaction
  ): Knex.QueryBuilder {
    const qb = super
      .queryBuilder(trx)(this.table)
      .withSchema(schema)
      .select(
        super
          .getConnection()
          .raw(`COUNT(${schema}.${this.table}.user_id)::INTEGER as total_count`)
      )
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.PROVIDER_USERS} as subordinate_detail ON subordinate_detail.id = user_id`
      )
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.PROVIDER_USERS} as supervisor_detail ON supervisor_detail.id = supervisor_id`
      )
      .where(`${schema}.${this.table}.supervisor_id`, supervisorId)
      .andWhere('supervisor_detail.isSupervisor', true)
      .andWhere(`${schema}.${this.table}.is_deleted`, false);

    return qb;
  }
}

export default UserSupervisor;
