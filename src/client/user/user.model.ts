import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import Knex, { Transaction } from 'knex';
import { userOrderFields } from '../common/constants/userListConstants';

const LIMIT_CONDITION = 0;

/**
 * User Model
 */
class User extends BaseModel {
  public static table: string = Table.PROVIDER_USERS;

  static defaultFilter = {
    'provider_users.isDeleted': false,
    'provider_users.isAppUser': true
  };

  /**
   * Build a reusable query builder object
   *
   * @param {Knex.transaction} trx
   */
  static buildFindQuery(schema: string, trx?: Transaction) {
    const qb = super
      .queryBuilder(trx)(Table.PROVIDER_USERS)
      .withSchema(schema)
      .select(
        `${schema}.${Table.PROVIDER_USERS}.id`,
        `${schema}.${Table.PROVIDER_USERS}.firstName`,
        `${schema}.${Table.PROVIDER_USERS}.organization_id`,
        `${schema}.${Table.PROVIDER_USERS}.lastName`,
        `${schema}.${Table.PROVIDER_USERS}.middleName`,
        `${schema}.${Table.PROVIDER_USERS}.email`,
        `${schema}.${Table.PROVIDER_USERS}.phoneNumbers`,
        `${schema}.${Table.PROVIDER_USERS}.isSuppressed`,
        `${schema}.${Table.PROVIDER_USERS}.isActive`,
        `${schema}.${Table.PROVIDER_USERS}.hasSignedUp`,
        `${schema}.${Table.PROVIDER_USERS}.lastLoginDate`,
        `${schema}.${Table.PROVIDER_USERS}.createdAt`,
        `${schema}.${Table.PROVIDER_USERS}.isAdmin`,
        `${schema}.${Table.PROVIDER_USERS}.isSupervisor`,
        `${schema}.${Table.PROVIDER_USERS}.position`,
        'organization.name as organizationName',
        'clientDomains',
        'clientDomainCount',
        'supervisors',
        'supervisorCount',
        'department.department_key as departmentKey',
        'department.department as department',
        'collaborators',
        'collaboratorsCount',
        'aliases',
        'aliasesCount',
        'aliasSharedWith',
        'aliasSharedCount',
        'collaboratorSharedWith',
        'collaboratorSharedCount',
        super
          .getConnection()
          .raw(
            `CONCAT(${Table.PROVIDER_USERS}.first_name, ' ', ${Table.PROVIDER_USERS}.last_name) as full_name`
          ),
        super
          .getConnection()
          .raw(
            "CONCAT(created_user.first_name, ' ', created_user.last_name) as createdBy"
          )
      )
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.DEPARTMENTS} as department ON ${schema}.${Table.PROVIDER_USERS}.department_id = department.id`
      )
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.PROVIDER_USERS} as created_user ON created_user.id = ${schema}.${Table.PROVIDER_USERS}.invited_by_id`
      )
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.ORGANIZATION} as organization ON organization.id = ${schema}.${Table.PROVIDER_USERS}.organization_id`
      )
      .joinRaw(
        //Get the ids of the client domains
        ` LEFT JOIN
              (
                 SELECT ${schema}.${Table.PROVIDER_USERS}.id, json_agg(json_build_object('id', cd.id, 'domain', cd.domain, 'mapped_date', domain_mapping.mapped_date) order by cd.domain) as client_domains, count( cd.id)::INTEGER as client_domain_count
                 FROM
                  ${schema}.${Table.PROVIDER_USERS_CLIENT_DOMAINS} domain_mapping
                 INNER JOIN ${schema}.${Table.CLIENT_DOMAINS} as cd ON domain_mapping.client_domain_id = cd.id
                 INNER JOIN ${schema}.${Table.PROVIDER_USERS} ON ${schema}.${Table.PROVIDER_USERS}.id = domain_mapping.provider_user_id
                 where domain_mapping.is_deleted = false
                 GROUP BY
                 ${schema}.${Table.PROVIDER_USERS}.id
               ) as client_user ON client_user.id = ${schema}.${Table.PROVIDER_USERS}.id`
      )
      .joinRaw(
        //supervisor mapping
        `LEFT JOIN
                (SELECT  mapped_user.id
                  ,json_agg(json_build_object('id',supervisors.id,'full_name',INITCAP(concat(supervisors.first_name,' ',supervisors.last_name)),'email',supervisors.email,'assigned_date',supervisors.updated_at) ORDER BY INITCAP(concat(supervisors.first_name,' ',supervisors.last_name))) AS supervisors
                  ,COUNT( supervisors.id)::INTEGER AS supervisor_count FROM
                ${schema}.${Table.PROVIDER_USERS_SUPERVISORS} as usm
                inner join ${schema}.${Table.PROVIDER_USERS} as supervisors ON supervisors.id = usm.supervisor_id
                inner join ${schema}.${Table.PROVIDER_USERS} as mapped_user ON mapped_user.id = usm.user_id
                WHERE usm.is_deleted = false
                GROUP BY
                   mapped_user.id
               ) as user_supervisor ON user_supervisor.id = provider_users.id`
      )
      .joinRaw(
        //collaborator mapping
        `LEFT JOIN
                (SELECT  collaborator_mapped_user.id
                  ,json_agg(json_build_object('id',collaborators.id,'full_name',INITCAP(concat(collaborators.first_name,' ',collaborators.last_name)),'email',collaborators.email,'assigned_date',collaborators.updated_at) ORDER BY INITCAP(concat(collaborators.first_name,' ',collaborators.last_name))) AS collaborators
                  ,COUNT( collaborators.id)::INTEGER AS collaborators_count FROM
                ${schema}.${Table.PROVIDER_USERS_COLLABORATORS} as ucm
                inner join ${schema}.${Table.PROVIDER_USERS} as collaborators ON collaborators.id = ucm.collaborator_id
                inner join ${schema}.${Table.PROVIDER_USERS} as collaborator_mapped_user ON collaborator_mapped_user.id = ucm.user_id
                WHERE ucm.is_deleted = false
                GROUP BY
                   collaborator_mapped_user.id
               ) as user_collaborator ON user_collaborator.id = provider_users.id`
      )
      .joinRaw(
        //alias mapping
        `LEFT JOIN
                (SELECT  alias_mapped_user.id
                  ,json_agg(json_build_object('id',aliases.id,'full_name',INITCAP(concat(aliases.first_name,' ',aliases.last_name)),'email',aliases.email,'assigned_date',aliases.updated_at) ORDER BY INITCAP(concat(aliases.first_name,' ',aliases.last_name))) AS aliases
                  ,COUNT( aliases.id)::INTEGER AS aliases_count FROM
                ${schema}.${Table.PROVIDER_USERS_ALIASES} as uam
                inner join ${schema}.${Table.PROVIDER_USERS} as aliases ON aliases.id = uam.alias_user_id
                inner join ${schema}.${Table.PROVIDER_USERS} as alias_mapped_user ON alias_mapped_user.id = uam.user_id
                WHERE uam.is_deleted = false
                GROUP BY
                   alias_mapped_user.id
               ) as user_alias ON user_alias.id = provider_users.id`
      )
      .joinRaw(
        //alias shared with mapping
        `LEFT JOIN
                (SELECT  alias_shared_mapped_user.id
                  ,json_agg(json_build_object('id',alias_shared_with.id,'full_name',INITCAP(CONCAT(alias_shared_with.first_name,' ',alias_shared_with.last_name)),'email',alias_shared_with.email,'accessTill',uam.alias_end_date) ORDER BY INITCAP(CONCAT(alias_shared_with.first_name,' ',alias_shared_with.last_name))) AS alias_shared_with
                  ,COUNT( alias_shared_with.id)::INTEGER AS alias_shared_count FROM
                ${schema}.${Table.PROVIDER_USERS_ALIASES} AS uam
                INNER JOIN ${schema}.${Table.PROVIDER_USERS} AS alias_shared_with ON alias_shared_with.id = uam.user_id
                INNER JOIN ${schema}.${Table.PROVIDER_USERS} AS alias_shared_mapped_user ON alias_shared_mapped_user.id = uam.alias_user_id
                WHERE uam.is_deleted = false
                GROUP BY
                   alias_shared_mapped_user.id
               ) AS user_alias_shared ON user_alias_shared.id = provider_users.id`
      )
      .joinRaw(
        //collaborator shared with mapping
        `LEFT JOIN
                (SELECT  collaborator_shared_mapped_user.id
                  ,json_agg(json_build_object('id',collaborator_shared_with.id,'full_name',INITCAP(CONCAT(collaborator_shared_with.first_name,' ',collaborator_shared_with.last_name)),'email',collaborator_shared_with.email,'accessTill',uam.collaboration_end_date) ORDER BY INITCAP(CONCAT(collaborator_shared_with.first_name,' ',collaborator_shared_with.last_name))) AS collaborator_shared_with
                  ,COUNT( collaborator_shared_with.id)::INTEGER AS collaborator_shared_count FROM
                ${schema}.${Table.PROVIDER_USERS_COLLABORATORS} AS uam
                INNER JOIN ${schema}.${Table.PROVIDER_USERS} AS collaborator_shared_with ON collaborator_shared_with.id = uam.user_id
                INNER JOIN ${schema}.${Table.PROVIDER_USERS} AS collaborator_shared_mapped_user ON collaborator_shared_mapped_user.id = uam.collaborator_id
                WHERE uam.is_deleted = false
                GROUP BY
                   collaborator_shared_mapped_user.id
               ) AS user_collaborator_shared ON user_collaborator_shared.id = provider_users.id`
      );
    return qb;
  }

  /**
   * Function that modifies the default buildQuery with pagination, sort and filter
   * @param filter TO DO: object with filter parameters for where search
   * @param pageParams object
   * @param sortParams object
   * @param callback callback fx
   */
  public static findUserWithPageAndSort(
    schema: string,
    filter: { [key: string]: any },
    pageParams: { page: number; pageSize: number },
    sortParams: { field?: string; direction?: string }[],
    search: string,
    callback?: any
  ) {
    const withSupervisors = filter.withSupervisors;
    const offset = (pageParams.page - 1) * pageParams.pageSize;
    const qb = this.buildFindQuery(schema);
    qb.where((builder: Knex.QueryBuilder) => {
      if (search != '' && search !== 'undefined') {
        builder
          .where(`${Table.PROVIDER_USERS}.email`, 'ilike', `%${search}%`)
          .orWhere(`${Table.PROVIDER_USERS}.firstName`, 'ilike', `%${search}%`)
          .orWhere(`${Table.PROVIDER_USERS}.lastName`, 'ilike', `%${search}%`)
          .orWhereRaw(
            `CONCAT(${Table.PROVIDER_USERS}.first_name, ${Table.PROVIDER_USERS}.last_name) ilike ?`,
            [`%${search.split(' ').join('')}%`]
          );
      }
    });
    qb.where((builder: Knex.QueryBuilder) => {
      if (withSupervisors == 'true') {
        builder.whereRaw('supervisors is not null');
      }
      if (withSupervisors == 'false') {
        builder.whereRaw('supervisors is null');
      }
    });
    delete filter.withSupervisors;
    qb.where(filter);
    qb.offset(offset);
    qb.limit(pageParams.pageSize);

    this.addOrderBy(qb, sortParams);

    if (callback) callback(qb);

    return qb;
  }

  /**
   * Find user by email.
   *
   * @param {string} email
   * @param {callback} callback
   * @param {Knex.Transaction} trx
   * @returns {Knex.QueryBuilder}
   */
  public static findByEmail(
    schema: string,
    email: string,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = this.buildFindQuery(schema, trx);

    qb.where(`${Table.PROVIDER_USERS}.email`, email);

    if (callback) callback(qb);
    return qb.then(([result]: any) => {
      return result;
    });
  }

  /**
   * Find user by pk.
   *
   * @param {number} id
   * @param {callback} callback
   * @param {Knex.Transaction} trx
   * @returns {Knex.QueryBuilder}
   */
  static findById(
    schema: string,
    id: number,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = this.buildFindQuery(schema, trx);

    qb.where(`${Table.PROVIDER_USERS}.id`, id);

    if (callback) callback(qb);

    return qb.then(([result]: any) => {
      if (result) {
        const phoneNumbers = JSON.parse(result.phoneNumbers);
        result.phoneNumbers = phoneNumbers;
      }
      return result;
    });
  }

  /**
   * Find user by ids.
   *
   * @param {number} id
   * @param {callback} callback
   * @param {Knex.Transaction} trx
   * @returns {Knex.QueryBuilder}
   */
  static findByIds(
    schema: string,
    ids: number[],
    callback?: any,
    trx?: Transaction
  ) {
    const qb = this.buildFindQuery(schema, trx);

    qb.whereIn(`${Table.PROVIDER_USERS}.id`, ids);

    if (callback) callback(qb);

    return qb;
  }

  /**
   * Find app user by pk.
   *
   * @param {number} id
   * @param {callback} callback
   * @param {Knex.Transaction} trx
   * @returns {Knex.QueryBuilder}
   */
  static findAppUserById(
    schema: string,
    id: number,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = this.buildFindQuery(schema, trx);

    qb.where(`${Table.PROVIDER_USERS}.id`, id);
    qb.where(this.defaultFilter);

    if (callback) callback(qb);

    return qb.then(([result]: any) => {
      if (result) {
        const phoneNumbers = JSON.parse(result.phoneNumbers);
        result.phoneNumbers = phoneNumbers;
      }
      return result;
    });
  }

  /**
   * Update by email in.
   *
   * @param emails string[]
   */
  static updateByEmailsIn(schema: string, emails: string[], query: any) {
    const users = super
      .queryBuilder()(Table.PROVIDER_USERS)
      .withSchema(schema)
      .whereIn('email', emails)
      .update(query);

    return users;
  }

  /**
   * Search suppressed user suggestions.
   *
   * @param searchQuery string
   * @param max number
   */
  static searchSuppressedUsersSuggestion(
    schema: string,
    searchQuery: string,
    max: number
  ) {
    const users = super
      .queryBuilder()(Table.PROVIDER_USERS)
      .withSchema(schema)
      .select(`${Table.PROVIDER_USERS}.email`)
      .where((builder: Knex.QueryBuilder) => {
        if (searchQuery != '' && searchQuery !== 'undefined') {
          builder.where(
            Table.PROVIDER_USERS + '.email',
            'ilike',
            `%${searchQuery}%`
          );
        }
      })
      .where({
        isDeleted: false,
        isSuppressed: false
      })
      .limit(max);
    return users;
  }

  /**
   * Search suppressed users.
   *
   * @param searchQuery string
   * @param max number
   */
  static searchSuppressedUsers(
    schema: string,
    searchQuery: string,
    max: number
  ) {
    const users = super
      .queryBuilder()(Table.PROVIDER_USERS)
      .withSchema(schema)
      .select(
        `${Table.PROVIDER_USERS}.id`,
        `${Table.PROVIDER_USERS}.firstName`,
        `${Table.PROVIDER_USERS}.lastName`,
        `${Table.PROVIDER_USERS}.email`
      )
      .where((builder: Knex.QueryBuilder) => {
        if (searchQuery != '' && searchQuery !== 'undefined') {
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
        isDeleted: false,
        isSuppressed: true
      })
      .limit(max);
    return users;
  }

  /**
   *
   * @param {Knex.QueryBuilder} qb
   * @param {Array} sortParams
   * To Do: Add sort conditions for role, supervisor and lastActive
   */
  static addOrderBy(
    qb: any,
    sortParams: { field?: string; direction?: string }[]
  ) {
    sortParams.forEach((sort) => {
      if (
        sort.field === userOrderFields.ID ||
        sort.field === userOrderFields.EMAIL
      )
        qb.orderBy(sort.field, sort.direction);
      else if (sort.field === userOrderFields.CLIENT_DOMAIN_COUNT)
        qb.orderByRaw(`client_domain_count ${sort.direction} NULLS LAST`);
      else if (sort.field === userOrderFields.USER)
        qb.orderByRaw(`provider_users.first_name ${sort.direction}`);
      else if (sort.field === userOrderFields.LAST_ACTIVE)
        qb.orderByRaw(
          `provider_users.last_login_date ${sort.direction} NULLS LAST`
        );
    });
  }

  /**
   * Returns query to find possible supervisors of user
   * @param id Number
   * @param callback function
   * @param trx transaction
   */
  public static buildPossibleSupervisorQuery(
    schema: string,
    userIds: number[],
    searchQuery: string,
    max: number,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.PROVIDER_USERS)
      .withSchema(schema)
      .select(
        `${Table.PROVIDER_USERS}.id`,
        `${Table.PROVIDER_USERS}.email`,
        super
          .getConnection()
          .raw(
            `CONCAT(${Table.PROVIDER_USERS}.first_name, ' ', ${Table.PROVIDER_USERS}.last_name) as full_name`
          )
      )
      .where((builder: Knex.QueryBuilder) => {
        if (searchQuery != '' && searchQuery !== 'undefined') {
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
        isSupervisor: true,
        isActive: true,
        isAppUser: true,
        isDeleted: false
      })
      .whereNotIn('id', userIds)
      .limit(max);

    if (callback) callback(qb);

    return qb;
  }

  /**
   * Returns query to find possible aliases of user
   * @param schema string   *
   * @param callback function
   * @param trx transaction
   */
  public static buildPossibleAliasQuery(
    schema: string,
    userIds: number[],
    searchQuery: string,
    max: number,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.PROVIDER_USERS)
      .withSchema(schema)
      .select(
        `${Table.PROVIDER_USERS}.id`,
        `${Table.PROVIDER_USERS}.email`,
        super
          .getConnection()
          .raw(
            `CONCAT(${Table.PROVIDER_USERS}.first_name, ' ', ${Table.PROVIDER_USERS}.last_name) as full_name`
          )
      )
      .where((builder: Knex.QueryBuilder) => {
        if (searchQuery != '' && searchQuery !== 'undefined') {
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
        isDeleted: false
      })
      .whereNotIn('id', userIds)
      .limit(max);

    if (callback) callback(qb);

    return qb;
  }

  /**
   * Search user suggestions.
   *
   * @param searchQuery string
   * @param max number
   */
  static fetchUserSuggestionByQuery(
    schema: string,
    searchQuery: string,
    max: number
  ) {
    const users = super
      .queryBuilder()(Table.PROVIDER_USERS)
      .withSchema(schema)
      .select(`${Table.PROVIDER_USERS}.email`)
      .where({
        isDeleted: false
      })
      .where((builder: Knex.QueryBuilder) => {
        builder
          .where(Table.PROVIDER_USERS + '.is_active', '=', 'false')
          .orWhere(Table.PROVIDER_USERS + '.has_signed_up', '=', 'false');
      })
      .where((builder: Knex.QueryBuilder) => {
        if (searchQuery != '' && searchQuery !== 'undefined') {
          builder.where(
            Table.PROVIDER_USERS + '.email',
            'ilike',
            `%${searchQuery}%`
          );
        }
      });
    if (max > LIMIT_CONDITION) {
      users.limit(max);
    }

    return users;
  }

  /**
   * Fetch Full Name sub query.
   *
   */
  static fetchFullNameSubquery(schema: string) {
    const queryBuilder = super
      .queryBuilder()(Table.PROVIDER_USERS)
      .withSchema(schema)
      .select(super.getConnection().raw("CONCAT(first_name, ' ', last_name)"))
      .where(
        'id',
        super
          .getConnection()
          .ref(
            `${Table.USER_SENDER_RECEIVER_ASSOCIATION}.sender_receiver_user_id`
          )
      );

    return queryBuilder;
  }

  /**
   * Update record
   * @param schema string
   * @param searchParams param
   * @param updateParams object
   */
  public static updateUser(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.PROVIDER_USERS)
      .withSchema(schema)
      .update(updateParams)
      .where(searchParams)
      .returning('*');

    return qb;
  }

  /**
   * Insert into provider users
   */
  public static create(schema: string, data: any, trx?: Transaction) {
    return super
      .queryBuilder(trx)
      .withSchema(schema)
      .insert(data)
      .into(Table.PROVIDER_USERS)
      .returning('*');
  }

  static buildUserQuery(schema: string, trx?: Transaction) {
    const qb = super
      .queryBuilder(trx)(Table.PROVIDER_USERS)
      .withSchema(schema)
      .select('*');

    return qb;
  }

  /**
   * Find user with query
   */
  public static findUser(
    schema: string,
    params: any,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = this.buildUserQuery(schema, trx).where(params);

    if (callback) callback(qb);

    return qb;
  }

  public static findUserWhereEmailIn(
    schema: string,
    query: any,
    emails: string[],
    callback?: any,
    trx?: Transaction
  ) {
    const qb = this.buildUserQuery(schema, trx)
      .where(query)
      .whereIn('email', emails);
    if (callback) callback(qb);

    return qb;
  }

  public static findOne(
    schema: string,
    query: any,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = this.buildUserQuery(schema, trx).where(query).limit(1);

    if (callback) callback(qb);

    return qb.then(([result]: any) => {
      return result;
    });
  }

  public static totalCount(schema: string, trx?: Transaction) {
    const queryBuilder = super
      .queryBuilder(trx)(Table.PROVIDER_USERS)
      .withSchema(schema)
      .count('sp_user_id')
      .first();

    return queryBuilder;
  }
}

export default User;
