import { Transaction } from 'knex';

import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import logger from '../../../src/core/utils/logger';

export type UsageReportType = {
  id: number;
  searches: number;
  lastSearch: Date;
  contactExports: number;
  attachmentExports: number;
  loggedBy: number;
  createdAt: Date;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  isSupervisor: boolean;
  department: string;
  emailsReviewed: number;
};

export type UsageReportWithRoleType = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  lastSearch: string;
  searches: number;
  contactExports: number;
  attachmentExports: number;
  emailsReviewed: number;
};

const allowedSortDict: { [x: string]: boolean } = {
  id: true,
  searches: true,
  lastSearch: true,
  contactExports: true,
  attachmentExports: true,
  createdAt: true,
  firstName: true,
  lastName: true,
  email: true,
  isAdmin: true,
  isSupervisor: true,
  department: true,
  emailsReviewed: true
};

const sortIndex: { [x: string]: string } = {
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  isAdmin: 'is_admin',
  isSupervisor: 'is_supervisor',
  department: 'department',
  searches: 'searches',
  contactExports: 'contact_exports',
  attachmentExports: 'attachment_exports',
  lastSearch: 'last_search',
  emailsReviewed: 'emails_reviewed'
};

class UsageReport extends BaseModel {
  public static table: string = Table.USAGE_REPORT;

  /**
   * Insert into usage reports relation
   *
   */
  public static create(
    schema: string,
    data: any,
    trx?: Transaction
  ): Promise<any> {
    return super
      .queryBuilder(trx)
      .withSchema(schema)
      .insert(data)
      .into(this.table)
      .returning('*');
  }

  /**
   * Update record
   * @param schema string
   * @param searchParams param
   * @param updateParams object
   */
  public static update(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(this.table)
      .withSchema(schema)
      .update(updateParams)
      .where(searchParams)
      .returning('*');
    return qb;
  }

  /**
   * Update usage report data from the user search interactions by invoking stored procedure.
   * pg prefix is for function using pl/pgsql raw queries
   * @param schema
   * @param data
   */
  public static pg_UpdateUsageReport(schema: string, data: any): Promise<void> {
    const dataString = JSON.stringify(data);
    //call stored procedure
    const query = `
        CALL pg_update_usage_report('${dataString}', '${schema}');
        `;

    logger.log('info', 'EventLog::Calling stored procedure: %s', query);

    return super.getConnection().raw(query);
  }

  public static fetchAllWithoutPaginationAndTimeFilterQb(
    schema: string,
    trx?: Transaction
  ): any {
    const qb = super
      .queryBuilder(trx)(this.table)
      .withSchema(schema)
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.PROVIDER_USERS} ON ${schema}.${Table.PROVIDER_USERS}.id = ${schema}.${this.table}.logged_by`
      )
      .joinRaw(
        `LEFT JOIN ${schema}.${Table.DEPARTMENTS} ON ${schema}.${Table.DEPARTMENTS}.id = ${schema}.${Table.PROVIDER_USERS}.department_id`
      );

    return qb;
  }

  /**
   * Fetch all usage report without any pagination limit and
   * return a query builder instance with time range filters
   * */
  public static fetchAllWithoutPaginationWithTimeFilterQb(
    schema: string,
    filterParams: {
      createdAtSince: string | undefined;
      createdAtUntil: string | undefined;
    },
    trx?: Transaction
  ): any {
    const qb = UsageReport.fetchAllWithoutPaginationAndTimeFilterQb(
      schema,
      trx
    );

    if (filterParams.createdAtSince && filterParams.createdAtUntil) {
      qb.where(
        `${schema}.${this.table}.eventTriggeredDate`,
        '>=',
        filterParams.createdAtSince
      ).where(
        `${schema}.${this.table}.eventTriggeredDate`,
        '<=',
        filterParams.createdAtUntil
      );
    }

    return qb;
  }

  public static async fetchTotalUsageStateWithoutPagination(
    schema: string,
    filterParams: {
      createdAtSince: string | undefined;
      createdAtUntil: string | undefined;
    },
    trx?: Transaction
  ): Promise<any> {
    const qb = UsageReport.fetchAllWithoutPaginationWithTimeFilterQb(
      schema,
      filterParams,
      trx
    );

    const response = await qb.sum({
      searches: `${schema}.${this.table}.searches`,
      contact_exports: `${schema}.${this.table}.contact_exports`,
      attachment_exports: `${schema}.${this.table}.attachment_exports`,
      emails_reviewed: `${schema}.${this.table}.emails_reviewed`
    });

    const totalStats = {
      searches: response[0].searches || '0',
      contactExports: response[0].contactExports || '0',
      attachmentExports: response[0].attachmentExports || '0',
      emailsReviewed: response[0].emailsReviewed || '0'
    };

    return totalStats;
  }

  /**
   * Fetch all usage report from database
   *
   * @returns Promise
   */
  public static fetchAllWithPagination(
    schema: string,
    pageParams: { page: number; pageSize: number },
    filterParams: {
      createdAtSince: string | undefined;
      createdAtUntil: string | undefined;
    },
    sort?: { order: -1 | 1; sortBy: string }[],
    trx?: Transaction
  ): Promise<UsageReportType[]> {
    // query builder for partial paginated and filtered data for usage_report
    const qb = UsageReport.fetchAllWithoutPaginationWithTimeFilterQb(
      schema,
      filterParams,
      trx
    );

    const offset = (pageParams.page - 1) * pageParams.pageSize;

    if (pageParams.pageSize) {
      qb.offset(offset).limit(pageParams.pageSize);
    }

    const COLUMNS = [
      `${schema}.${Table.PROVIDER_USERS}.first_name`,
      `${schema}.${Table.PROVIDER_USERS}.last_name`,
      `${schema}.${Table.PROVIDER_USERS}.email`,
      `${schema}.${Table.PROVIDER_USERS}.isAdmin`,
      `${schema}.${Table.PROVIDER_USERS}.isSupervisor`,
      `${schema}.${Table.DEPARTMENTS}.department`
    ];

    qb.select(...COLUMNS)
      .sum({
        searches: `${schema}.${this.table}.searches`,
        contact_exports: `${schema}.${this.table}.contact_exports`,
        attachment_exports: `${schema}.${this.table}.attachment_exports`,
        emails_reviewed: `${schema}.${this.table}.emails_reviewed`
      })
      .max({
        last_search: `${schema}.${this.table}.last_search`
      })
      .groupBy(...COLUMNS);

    const filteredSort = sort
      ? sort.filter((sorter) => allowedSortDict[sorter.sortBy])
      : [];

    filteredSort.forEach((sorter) => {
      qb.orderByRaw(
        `${sortIndex[sorter.sortBy]} ${
          sorter.order < 0 ? 'desc' : 'asc'
        } NULLS LAST`
      );
    });

    return qb;
  }

  /**
   * Fetch all usage report from database
   *
   * @returns Promise
   */
  public static countAll(
    schema: string,
    filterParams: {
      createdAtSince: string | undefined;
      createdAtUntil: string | undefined;
    },
    trx?: Transaction
  ): Promise<number> {
    const qb = super.queryBuilder(trx)(this.table).withSchema(schema);

    if (filterParams.createdAtSince && filterParams.createdAtUntil) {
      qb.where(
        `${schema}.${this.table}.eventTriggeredDate`,
        '>=',
        filterParams.createdAtSince
      ).where(
        `${schema}.${this.table}.eventTriggeredDate`,
        '<=',
        filterParams.createdAtUntil
      );
    }

    return qb
      .countDistinct('logged_by')
      .then(([{ count }]: [{ count: string }]) => +count);
  }

  /**
   * Fetch all usage report from database
   *
   * @returns Promise
   */
  public static fetchAllInLoggedBy(
    schema: string,
    loggedByList: Array<number>,
    trx?: Transaction
  ): Promise<any> {
    return super
      .queryBuilder(trx)
      .withSchema(schema)
      .select()
      .whereIn('logged_by', loggedByList)
      .from(this.table);
  }
}

export default UsageReport;
