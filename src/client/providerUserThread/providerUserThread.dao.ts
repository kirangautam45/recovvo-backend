import logger from '../../core/utils/logger';
import ProviderUserThread from './providerUserThread.model';
import IProviderUserThread from './interfaces/providerUserThread.interface';

/**
 * Fetch list of provider user thread with filtered query.
 *
 * @param contactId number
 * @param filter Object
 */
export async function fetchByContactId(
  schema: string,
  contactId: number,
  providerUserIds: any,
  pageParams: { pageSize: number; page: number },
  filter?: any
): Promise<IProviderUserThread[]> {
  logger.log(
    'info',
    'Fetching list of provider user thread with filter',
    filter
  );

  return await ProviderUserThread.fetchByContactId(
    schema,
    contactId,
    providerUserIds,
    pageParams,
    filter
  );
}

/**
 * Fetch list of provider user thread with filtered query.
 *
 * @param userId number
 * @param filter Object
 */
export function fetchByUserId(
  schema: string,
  userId: number,
  pageParams: { pageSize: number; page: number },
  searchParam: any,
  durationParams?: { emailsFrom?: Date; emailsUpto?: Date },
  hasAttachments?: string,
  sortParams?: { field?: string; direction?: string },
  hasClientResponse?: string
): Promise<IProviderUserThread[]> {
  logger.log(
    'info',
    'Fetching list of provider user thread with search and filter of user id',
    userId
  );

  return ProviderUserThread.fetchByUserId(
    schema,
    userId,
    pageParams,
    searchParam,
    durationParams,
    hasAttachments,
    sortParams,
    hasClientResponse
  );
}

/**
 * Fetch total number of contacts with filtered query.
 *
 * @param filter
 */
export function fetchTotalProviderUserThreadWithFilter(
  schema: string,
  contactId: number,
  providerUserIds: any,
  filter?: any
): Promise<any> {
  logger.log(
    'info',
    'Fetch total number of provider threads users with filter %s',
    filter
  );
  return ProviderUserThread.countWithFilter(
    schema,
    contactId,
    providerUserIds,
    filter
  );
}

/**
 * Fetch total number of threads of a particular user.
 *
 * @param filter
 */
export function fetchThreadsWithoutPagination(
  schema: string,
  userId: number,
  searchParam?: any,
  filterParams?: any,
  hasAttachments?: string,
  hasClientResponse?: string
): Promise<{ count: number }> {
  logger.log(
    'info',
    'Fetch total number of threads after filtering of user %s',
    userId
  );
  return ProviderUserThread.fetchTotalThreadsCountWithFilter(
    schema,
    userId,
    searchParam,
    filterParams,
    hasAttachments,
    hasClientResponse
  );
}

/**
 * Fetch total number of threads without filters of a particular user.
 *
 * @param filter
 */
export function fetchTotalThreadCountByUserId(
  schema: string,
  userId: number
): Promise<{ count: number }> {
  logger.log(
    'info',
    'Fetch total number of threads of provider user %s',
    userId
  );
  return ProviderUserThread.fetchTotalThreadCountWithoutFilter(schema, userId);
}

/**
 * Fetch client domain ids by provider user id.
 *
 * @param providerUserThreadId number
 */
export function fetchClientDomainIdsById(
  schema: string,
  providerUserThreadId: number
): Promise<any> {
  logger.log(
    'info',
    'Fetch client domain ids by provider user id',
    providerUserThreadId
  );
  return ProviderUserThread.fetchClientDomainIdsById(
    schema,
    providerUserThreadId
  );
}

/**
 * Fetch list of provider user thread with filtered query.
 *
 * @param userId number
 * @param filter Object
 */
export function fetchThreadIdsByUserId(
  schema: string,
  userId: number
): Promise<any> {
  logger.log(
    'info',
    `Fetching list of provider user thread using userId ${userId}`
  );
  return ProviderUserThread.fetchThreadIdsByUserId(schema, userId);
}
