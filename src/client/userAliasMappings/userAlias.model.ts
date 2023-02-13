import moment from 'moment';
import Knex, { Transaction } from 'knex';

import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import { filterWithEmailOrNameQuery } from '../../core/utils/query';
import {
  DEFAULT_DATE_TIME_FORMAT,
  DEFAULT_DATE_FORMAT
} from '../../client/common/constants/dateTimeConstants';

/**
 * UserAlias Model
 */
class UserAlias extends BaseModel {
  public static table: string = Table.PROVIDER_USERS_ALIASES;

  /**
   * Update record
   * @param schema string
   * @param searchParams param
   * @param updateParams object
   */
  public static updateUserAlias(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const updatedAt = new Date().toISOString();

    const qb = super
      .queryBuilder(trx)(Table.PROVIDER_USERS_ALIASES)
      .withSchema(schema)
      .update({ ...updateParams, updatedAt })
      .where(searchParams)
      .returning('*');

    return qb;
  }
  /**
   * Create record
   * @param schema string
   * @param data object
   */
  public static create(schema: string, data: any, trx?: Transaction) {
    return super
      .queryBuilder(trx)
      .withSchema(schema)
      .insert(data)
      .into(Table.PROVIDER_USERS_ALIASES)
      .returning('*');
  }

  /**
   * Gets users's aliases and filters the data with searchparam.
   *
   * @param {String} schema
   * @param {Number} userId
   * @param {String} searchParam
   * @param trx transaction
   */
  public static findByUserIdWithSearchParams(
    schema: string,
    userId: number | undefined,
    searchParam: string,
    trx?: Transaction
  ): Knex.QueryBuilder {
    const qb = super
      .queryBuilder(trx)(this.table)
      .withSchema(schema)
      .select(
        `${schema}.${this.table}.user_id`,
        `${schema}.${this.table}.alias_user_id`,
        super
          .getConnection()
          .raw(
            `CONCAT(alias_user_detail.first_name, ' ', alias_user_detail.last_name) as full_name`
          ),
        `email,`
      )
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.PROVIDER_USERS} as alias_user_detail ON id = alias_user_id`
      )
      .where(`${schema}.${this.table}.user_id`, userId)
      .andWhere(`${schema}.${this.table}.is_deleted`, false)
      .andWhere((builder: Knex.QueryBuilder) => {
        filterWithEmailOrNameQuery(builder, searchParam, 'alias_user_detail');
      })
      .orderByRaw(
        'CASE WHEN (first_name is NOT NULL) THEN first_name ELSE email END'
      );

    return qb;
  }

  /**
   * Gets total count of users's supervisors.
   *
   * @param {String} schema
   * @param {Number} userId
   * @param {String} searchParam
   * @param trx transaction
   */
  public static getTotalCountOfUserAliases(
    schema: string,
    userId: number | undefined,
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
        `LEFT JOIN ${schema}.${Table.PROVIDER_USERS} as alias_user_detail ON id = alias_user_id`
      )
      .where(`${schema}.${this.table}.user_id`, userId)
      .andWhere(`${schema}.${this.table}.is_deleted`, false);

    return qb;
  }

  /**
   * Find record
   * @param schema string
   * @param aliasIds array Number
   */
  public static findByAliasIds(
    schema: string,
    aliasIds: number[],
    userId: number | undefined,
    searchParam?: string,
    trx?: Transaction
  ) {
    const fullNameRaw = `INITCAP(CONCAT(alias_user_detail.first_name, ' ', alias_user_detail.last_name))`;
    const qb = super
      .queryBuilder(trx)(Table.PROVIDER_USERS_ALIASES)
      .withSchema(schema)
      .select(
        `${schema}.${Table.PROVIDER_USERS_ALIASES}.user_id`,
        `${schema}.${Table.PROVIDER_USERS_ALIASES}.alias_user_id`,
        `${schema}.${Table.PROVIDER_USERS_ALIASES}.is_custom_access_duration_set`,
        `${schema}.${Table.PROVIDER_USERS_ALIASES}.alias_start_date`,
        `${schema}.${Table.PROVIDER_USERS_ALIASES}.alias_end_date`,
        `${schema}.${Table.PROVIDER_USERS_ALIASES}.historical_email_access_start_date`,
        `${schema}.${Table.PROVIDER_USERS_ALIASES}.historical_email_access_end_date`,
        super.getConnection().raw(`${fullNameRaw} as full_name`),
        `email,`
      )
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.PROVIDER_USERS} as alias_user_detail ON id = alias_user_id`
      )
      .whereIn(
        `${schema}.${Table.PROVIDER_USERS_ALIASES}.alias_user_id`,
        aliasIds
      )

      .andWhere(`${schema}.${Table.PROVIDER_USERS_ALIASES}.is_deleted`, false)
      .andWhere(`${schema}.${Table.PROVIDER_USERS_ALIASES}.user_id`, userId);
    if (searchParam) {
      qb.andWhere((builder: Knex.QueryBuilder) => {
        filterWithEmailOrNameQuery(builder, searchParam, 'alias_user_detail');
      });
    }

    return qb.orderByRaw(fullNameRaw);
  }

  /**
   *
   * @param schema
   * @param userId
   * @param callback
   * @param trx
   * @returns {Knex.QueryBuilder}
   */
  public static fetchActiveAliasUserByUserId(
    schema: string,
    userId: number,
    callback?: any,
    trx?: Transaction
  ) {
    // Access condition, is_deteted=false, alias_end_date > current_date > alias_start_date

    const currentDate = moment().format(DEFAULT_DATE_TIME_FORMAT);

    const qb = super
      .queryBuilder(trx)(this.table)
      .withSchema(schema)
      .select(
        `${schema}.${this.table}.alias_user_id`,
        `${schema}.${this.table}.historical_email_access_start_date`,
        `${schema}.${this.table}.historical_email_access_end_date`
      )
      .where({ userId: userId })
      .andWhere({ isDeleted: false })
      .andWhere('alias_start_date', '<', currentDate)
      .whereRaw(
        `(alias_end_date IS NULL OR alias_end_date > TO_TIMESTAMP('${currentDate}', '${DEFAULT_DATE_FORMAT}'))`
      );

    if (callback) callback(qb);

    return qb;
  }

  public static fetchActiveAliasUserByUserAndAliasUserIdsIn(
    schema: string,
    userId: number,
    aliasUserIds: number[],
    callback?: any,
    trx?: Transaction
  ) {
    const currentDate = moment(new Date()).format(DEFAULT_DATE_TIME_FORMAT);

    const qb = super
      .queryBuilder(trx)(this.table)
      .withSchema(schema)
      .select(
        `${schema}.${this.table}.alias_user_id`,
        `${schema}.${this.table}.historical_email_access_start_date`,
        `${schema}.${this.table}.historical_email_access_end_date`
      )
      .where({ userId: userId, isDeleted: false })
      .whereIn('alias_user_id', aliasUserIds)
      .andWhere('alias_start_date', '<', currentDate)
      .whereRaw(
        `(alias_end_date IS NULL OR alias_end_date > TO_TIMESTAMP('${currentDate}', '${DEFAULT_DATE_FORMAT}'))`
      );

    if (callback) callback(qb);

    return qb;
  }
}

export default UserAlias;
