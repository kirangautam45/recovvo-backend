import {
  DEFAULT_PAGE,
  DEFAULT_SIZE,
  DEFAULT_SORT_FIELD,
  DEFAULT_SORT_DIRECTION
} from '../../client/common/constants/recovoConstant';

export interface PageParams {
  page: number;
  pageSize: number;
}

interface SortParams {
  field: string;
  direction: string;
}

/**
 * Page params.
 *
 * @param query any
 */
export function getPageParams(query: any): PageParams {
  const page: number = DEFAULT_PAGE;
  const pageSize: number = DEFAULT_SIZE;

  return {
    page: Number(query.page) || page,
    pageSize: Number(query.pageSize) || pageSize
  };
}

/**
 * Sort params
 *
 * @param query any
 * @param sortField string
 * @param sortDirection string
 */
export function getSortParams(
  query: any,
  sortField: string = DEFAULT_SORT_FIELD,
  sortDirection: string = DEFAULT_SORT_DIRECTION
): SortParams {
  return {
    field: query.sortField || sortField,
    direction: query.sortDirection || sortDirection
  };
}

/**
 * Paginate Data
 *
 * @param data any
 * @param pageParams any
 * @param total number
 * @param totalStats contain aggregate data irrespective of pagination
 */
export function paginateData(
  data: any,
  pageParams: any,
  total: number,
  totalStats: any = {}
) {
  const lastPage = Math.max(Math.ceil(total / pageParams.pageSize), 1);
  const hasNextPage = pageParams.page < lastPage;

  return {
    data,
    total,
    hasNextPage,
    ...pageParams,
    totalStats
  };
}

/**
 * Function that returns the tenantName from the path
 * @param urlPath string
 */
export function getTenantSchemaName(urlPath: string): string {
  const encodedSchemaName = urlPath.split('/')[3];
  const buff = Buffer.from(encodedSchemaName, 'base64');
  const decodedSchemaName = buff.toString('ascii');
  return decodedSchemaName;
}

export function getUserDomainForSchema(email: string): string {
  const domain = email.substring(email.lastIndexOf('@') + 1).split('.')[0];
  return domain;
}

/**
 * Get domain from email.
 *
 * @param email
 */
export function getDomainFromEmail(email: string) {
  let emailDomain = null;
  const pos = email.search('@');
  if (pos > 0) {
    emailDomain = email.slice(pos + 1);
  }
  return emailDomain;
}

/**
 * Get original url after prefix
 *
 * @param url
 */
export function getOriginalUrlAfterPrefix(url: string) {
  const BASE_URL_INDEX = 4;

  return `/${url.split('?')[0].split('/').slice(BASE_URL_INDEX).join('/')}`;
}
