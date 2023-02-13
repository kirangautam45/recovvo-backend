import moment from 'moment';
import Knex, { Transaction } from 'knex';

import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import { isEmpty } from '../../core/utils/string';
import { filterWithEmailOrNameQuery } from '../../core/utils/query';
import { DEFAULT_DATE_TIME_FORMAT } from '../../client/common/constants/dateTimeConstants';

/**
 * User Collaborator Model
 */
class UserCollaborator extends BaseModel {
  public static table: string = Table.PROVIDER_USERS_COLLABORATORS;

  /**
   * Build a reusable query builder object
   *
   * @param {Knex.transaction} trx
   */
  static buildFindQuery(schema: string, trx?: Transaction) {
    const qb = super
      .queryBuilder(trx)(this.table)
      .withSchema(schema)
      .select(
        `${schema}.${this.table}.collaborator_id`,
        `${schema}.${this.table}.user_id`,
        `${schema}.${this.table}.collaboration_start_date`,
        `${schema}.${this.table}.collaboration_end_date`,
        `${schema}.${this.table}.is_custom_access_duration_set`,
        super
          .getConnection()
          .raw(
            `INITCAP(CONCAT(collaborator_user_detail.first_name, ' ', collaborator_user_detail.last_name)) as full_name`
          ),
        `email,`
      )
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.PROVIDER_USERS} as collaborator_user_detail ON id = collaborator_id`
      )
      .andWhere(`${schema}.${this.table}.is_deleted`, false);
    return qb;
  }

  /**
   * Update record in user collaborator table
   * @param schema string
   * @param searchParams param
   * @param updateParams object
   */
  public static update(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ): any {
    const updatedAt = new Date().toISOString();
    const qb = super
      .queryBuilder(trx)(this.table)
      .withSchema(schema)
      .update({ ...updateParams, updatedAt })
      .where(searchParams)
      .returning('*');
    return qb;
  }

  /**
   * Insert into provider_users_collaborator table
   */
  public static create({
    schema,
    data,
    trx
  }: {
    schema: string;
    data: any;
    trx?: Transaction;
  }): any {
    return super
      .queryBuilder(trx)
      .withSchema(schema)
      .insert(data)
      .into(this.table)
      .returning('*');
  }

  /**
   * Find user by ids.
   *
   * @param {number} id
   * @param {callback} callback
   * @param {Knex.Transaction} trx
   * @returns {Knex.QueryBuilder}
   */
  public static findByIds(
    schema: string,
    collaboratorIds: number[],
    userId: number,
    searchParam: string,
    callback?: any,
    trx?: Transaction
  ): Knex.QueryBuilder {
    const fullNameRaw = `CONCAT(collaborator_user_detail.first_name, ' ', collaborator_user_detail.last_name)`;
    const qb = this.buildFindQuery(schema, trx);

    qb.whereIn(`${this.table}.collaboratorId`, collaboratorIds).andWhere(
      'userId',
      userId
    );

    if (searchParam) {
      qb.andWhere((builder: Knex.QueryBuilder) => {
        filterWithEmailOrNameQuery(
          builder,
          searchParam,
          'collaborator_user_detail'
        );
      });
    }

    if (callback) callback(qb);
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
  public static fetchActiveCollaboratorByUserId(
    schema: string,
    userId: number,
    callback?: any,
    trx?: Transaction
  ) {
    // Access condition, is_deteted=false, collaboration_end_date > current_date > collaboration_start_date

    const currentDate = moment().format(DEFAULT_DATE_TIME_FORMAT);

    const qb = super
      .queryBuilder(trx)(this.table)
      .withSchema(schema)
      .select(`${schema}.${this.table}.collaborator_id`)
      .where({ userId: userId, isDeleted: false })
      .andWhere('collaboration_start_date', '<', currentDate)
      .whereRaw(`collaboration_end_date IS NULL`)
      .orWhere('collaboration_end_date', '>', currentDate);
    if (callback) callback(qb);

    return qb;
  }

  /**
   * Returns query to find possible collaborator of user
   * @param id Number
   * @param callback function
   * @param trx transaction
   */
  public static buildPossibleCollaboratorQuery(
    schema: string,
    id: number,
    existingCollaboratorIds: number[],
    searchQuery?: string,
    max?: number,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.PROVIDER_USERS)
      .withSchema(schema)
      .select(
        `${Table.PROVIDER_USERS}.id`,
        `${Table.PROVIDER_USERS}.email`,
        `${Table.PROVIDER_USERS}.id as collaborator_id`,
        super
          .getConnection()
          .raw(
            `CONCAT(${Table.PROVIDER_USERS}.first_name, ' ', ${Table.PROVIDER_USERS}.last_name) as full_name`
          )
      )
      .where((builder: Knex.QueryBuilder) => {
        if (searchQuery && !isEmpty(searchQuery)) {
          builder
            .where(`${Table.PROVIDER_USERS}.email`, 'ilike', `%${searchQuery}%`)
            .orWhere(
              `${Table.PROVIDER_USERS}.firstName`,
              'ilike',
              `%${searchQuery}%`
            )
            .orWhere(
              `${Table.PROVIDER_USERS}.lastName`,
              'ilike',
              `%${searchQuery}%`
            )
            .orWhereRaw(
              `CONCAT(${Table.PROVIDER_USERS}.first_name, ${Table.PROVIDER_USERS}.last_name) ilike ?`,
              [`%${searchQuery.split(' ').join('')}%`]
            );
        }
      })
      .where({
        isActive: true,
        isAppUser: true,
        isDeleted: false
      })
      .whereNotIn('id', existingCollaboratorIds)
      .whereNot('id', id)
      .limit(max);

    if (callback) callback(qb);

    return qb;
  }

  /**
   * Gets users's collaborator and filters the data with searchparam.
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
        `${schema}.${this.table}.collaborator_id`,
        super
          .getConnection()
          .raw(
            `CONCAT(collaborator_detail.first_name, ' ', collaborator_detail.last_name) as full_name`
          ),
        `email,`
      )
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.PROVIDER_USERS} as collaborator_detail ON id = collaborator_id`
      )
      .where(`${schema}.${this.table}.user_id`, userId)
      .andWhere(`${schema}.${this.table}.is_deleted`, false)
      .andWhere((builder: Knex.QueryBuilder) => {
        filterWithEmailOrNameQuery(builder, searchParam, 'collaborator_detail');
      })
      .orderByRaw(
        'CASE WHEN (first_name IS NOT NULL) THEN first_name ELSE email END'
      );

    return qb;
  }

  /**
   * Gets total count of users's collaborator.
   *
   * @param {String} schema
   * @param {Number} userId
   * @param trx transaction
   */
  public static getTotalCountOfCollaborators(
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
        `LEFT JOIN ${schema}.${Table.PROVIDER_USERS} as collaborator_detail ON id = collaborator_id`
      )
      .where(`${schema}.${this.table}.user_id`, userId)
      .andWhere(`${schema}.${this.table}.is_deleted`, false);

    return qb;
  }
}

export default UserCollaborator;
