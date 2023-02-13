import { QueryBuilder, Transaction } from 'knex';

import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import { DESC, ASC } from './searchReport.constants';
import { searchReportOrderFields } from './searchReport.constants';
import { DEFAULT_DATE_FORMAT } from '../../client/common/constants/dateTimeConstants';

class SearchReport extends BaseModel {
  public static table: string = Table.SEARCH_REPORT;

  /**
   * Sorts search report.
   *
   * @param qb QueryBuilder
   * @param sort {order : DESC | ASC, sortBy: string}
   */
  static addOrderBy(
    qb: QueryBuilder,
    sort: { order: DESC | ASC; sortBy: string }[]
  ) {
    sort.forEach((sortParams) => {
      const direction =
        sortParams.order && sortParams.order < 0 ? 'DESC' : 'ASC';

      if (sortParams.sortBy === searchReportOrderFields.USER) {
        qb.orderByRaw(`provider_users.first_name ${direction}`);
      }
      if (sortParams.sortBy === searchReportOrderFields.DEPARTMENT) {
        qb.orderByRaw(`${Table.DEPARTMENTS}.department ${direction}`);
      }

      sortParams.sortBy && qb.orderByRaw(`${sortParams.sortBy} ${direction}`);
    });
  }

  /**
   * Filters search report according to time range.
   *
   * @param qb QueryBuilder
   * @param timeRange { createdAtFrom?: string; createdAtTo?: string }
   */
  static filterSearchReport(
    qb: QueryBuilder,
    timeRange: { createdAtFrom?: string; createdAtTo?: string }
  ) {
    if (timeRange.createdAtFrom && timeRange.createdAtTo) {
      qb.whereRaw(
        `${this.table}.created_at::timestamp::date >= TO_TIMESTAMP('${timeRange.createdAtFrom}', '${DEFAULT_DATE_FORMAT}')::date`
      ).whereRaw(
        `${this.table}.created_at::timestamp::date <= TO_TIMESTAMP('${timeRange.createdAtTo}', '${DEFAULT_DATE_FORMAT}')::date`
      );
    }
  }

  /**
   * Insert into search report table.
   *
   * @param schema string
   * @param data any
   * @param trx Transaction
   * @returns Promise
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
   * Gets all search report in database.
   *
   * @param schema string
   * @param timeRange { createdAtFrom?: string; createdAtTo?: string }
   * @param sort {order : DESC | ASC, sortBy: string}
   * @param trx Transaction
   *
   * @returns Promise
   */
  public static fetchAll(
    schema: string,
    timeRange?: { createdAtFrom?: string; createdAtTo?: string },
    sort?: { order: DESC | ASC; sortBy: string }[],
    trx?: Transaction
  ): QueryBuilder {
    const qb = super
      .queryBuilder(trx)(this.table)
      .withSchema(schema)
      .select(
        super
          .getConnection()
          .raw(
            `CONCAT(${Table.PROVIDER_USERS}.first_name, ' ', ${Table.PROVIDER_USERS}.last_name) AS user`
          ),
        `${Table.DEPARTMENTS}.department AS department`,
        'primary_search',
        'secondary_search',
        'searched',
        `${Table.SEARCH_REPORT}.created_at`
      )
      .from(this.table, Table.PROVIDER_USERS, Table.DEPARTMENTS)
      .leftJoin(Table.PROVIDER_USERS, 'logged_by', `${Table.PROVIDER_USERS}.id`)
      .leftJoin(
        Table.DEPARTMENTS,
        `${Table.PROVIDER_USERS}.department_id`,
        `${Table.DEPARTMENTS}.id`
      );
    timeRange && this.filterSearchReport(qb, timeRange);

    sort && this.addOrderBy(qb, sort);

    return qb;
  }

  /**
   * Gets count of the search report in database.
   *
   * @param schema string
   * @param timeRange {createdAtFrom: string, createdAtTo: string}
   * @param trx Transaction
   * @returns Promise
   */
  public static countAll(
    schema: string,
    timeRange?: {
      createdAtFrom?: string;
      createdAtTo?: string;
    },
    trx?: Transaction
  ): Promise<number> {
    const qb = super.queryBuilder(trx)(this.table).withSchema(schema);

    timeRange && this.filterSearchReport(qb, timeRange);

    return qb
      .count('logged_by')
      .then(([{ count }]: [{ count: string }]) => +count);
  }

  /**
   * Fetches all search report from database with pagination.
   *
   * @returns Promise
   */
  public static fetchPaginated(
    schema: string,
    pageParams: { page: number; pageSize: number },
    timeRange?: { createdAtFrom?: string; createdAtTo?: string },
    sort?: { order: DESC | ASC; sortBy: string }[],
    trx?: Transaction
  ): Promise<any[]> {
    const qb = this.fetchAll(schema, timeRange, sort, trx);

    const offset = (pageParams.page - 1) * pageParams.pageSize;

    if (pageParams.pageSize) {
      qb.offset(offset).limit(pageParams.pageSize);
    }

    return qb;
  }
}

export default SearchReport;
