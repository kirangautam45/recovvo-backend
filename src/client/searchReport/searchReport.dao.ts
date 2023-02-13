import SearchReport from './searchReport.model';
import { DESC, ASC } from './searchReport.constants';
import { ITimeRange } from './searchReport.interface';

/**
 * Gets search report.
 *
 * @param {string} schema
 * @param {Object} timeRange { createdAtFrom?: string; createdAtTo?: string }
 * @param {Object} sort {order : DESC | ASC, sortBy: string}
 *
 * @returns Promise
 */
export async function fetchAllSearchReport(
  schema: string,
  timeRange?: ITimeRange,
  sort?: { order: DESC | ASC; sortBy: string }[]
): Promise<any> {
  return await SearchReport.fetchAll(schema, timeRange, sort);
}

/**
 * Gets search report with pagination.
 *
 * @param schema string
 * @param {Object} pageParams {page: number, pageSize: number}
 * @param {Object} timeRange { createdAtFrom?: string; createdAtTo?: string }
 * @param {Object} sort {order : DESC | ASC, sortBy: string}
 *
 * @returns Promise
 */
export async function fetchPaginatedSearchReport(
  schema: string,
  pageParams: { page: number; pageSize: number },
  timeRange?: ITimeRange,
  sort?: { order: DESC | ASC; sortBy: string }[]
): Promise<any> {
  return SearchReport.fetchPaginated(schema, pageParams, timeRange, sort);
}

/**
 * Gets count of the searches.
 *
 * @param schema string
 * @param {Object} timeRange {createdAtFrom: string, createdAtTo: string}
 *
 * @returns Promise
 */
export async function countAll(
  schema: string,
  timeRange?: ITimeRange
): Promise<any> {
  return await SearchReport.countAll(schema, timeRange);
}
