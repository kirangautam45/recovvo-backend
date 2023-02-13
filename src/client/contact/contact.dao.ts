import { Transaction } from 'knex';

import Contact from './contact.model';
import logger from '../../core/utils/logger';
import IContact from './interfaces/contact.interface';
import IVisibleProvidersInfo from '../../client/messagePart/interfaces/visibleProvidersInfo.interface';

/**
 * Fetch list of contacts with filtered query.
 *
 * @param pageParams Object
 * @param search Object
 */
export function fetchContactsWithFilter(
  schema: string,
  sortParams: { field: string; direction: string },
  visibleProvidersInfos: {
    data: IVisibleProvidersInfo[];
    contactId: number;
  }[],
  filter?: any
): Promise<any> {
  logger.log('info', 'Fetching list of contacts with filter', filter);

  return Contact.fetchWithFilter(
    schema,
    sortParams,
    visibleProvidersInfos,
    filter
  );
}

/**
 * Fetch list of contacts with filtered query and page.
 *
 * @param pageParams Object
 * @param search Object
 */
export function fetchContactsWithFilterAndPage(
  schema: string,
  pageParams: { pageSize: number; page: number },
  sortParams: { field: string; direction: string },
  visibleProvidersInfos: {
    data: IVisibleProvidersInfo[];
    contactId: number;
  }[],
  filter?: any
): Promise<any> {
  logger.log('info', 'Fetching list of contacts with filter', filter);

  return Contact.findWithFilterAndPage(
    schema,
    pageParams,
    sortParams,
    visibleProvidersInfos,
    filter
  );
}

/**
 * Fetch total number of contacts with filtered query.
 *
 * @param filter
 */
export async function fetchTotalContactsWithFilter(
  schema: string,
  filter?: any
): Promise<any> {
  logger.log('info', 'Fetch total number of contacts with filter', filter);

  return await Contact.countWithFilter(schema, filter);
}

/**
 * Find one contact by query.
 *
 * @param query object
 */
export async function findOne(
  schema: string,
  query: any,
  tx?: Transaction
): Promise<IContact | null> {
  logger.log('info', 'Find one contact from database', query);

  return await Contact.findFirstRecord(schema, query, tx);
}

/**
 * Find contact by id.
 *
 * @returns Promise
 */
export async function findById(
  schema: string,
  id: number
): Promise<IContact | null> {
  logger.log('info', 'Fetching contact by id %i from database', id);

  return await Contact.find({ id }).withSchema(schema);
}

/**
 * Find contacts by contact ids.
 *
 * @param schema
 * @param clientDomainIds
 * @returns
 */
export async function findByIds(
  schema: string,
  contactIds: number[]
): Promise<IContact[] | null> {
  logger.log('info', 'Fetching contacts by ids %s', contactIds);
  return await Contact.findByContactIdsIn(schema, contactIds);
}

/**
 * Find by client domain ids in.
 *
 * @param schema
 * @param clientDomainIds
 * @returns
 */
export async function findByClientDomainIdsIn(
  schema: string,
  clientDomainIds: number[]
) {
  return await Contact.findByClientDomainIdsIn(schema, clientDomainIds);
}

/**
 * Find contact by id.
 *
 * @param schema string
 * @param emails string[]
 *
 * @returns Promise
 */
export async function findByEmailIn(
  schema: string,
  emails: string[]
): Promise<any> {
  logger.log(
    'info',
    'Fetching contact by emails %i from database',
    emails.join(',')
  );

  return await Contact.findByEmailIn(schema, emails);
}

/**
 * Finds the client domain contact by
 * using the provider user thread id.
 *
 * @param schema string
 * @param id number
 *
 * */
export async function findByProviderUserThreadId(
  schema: string,
  id: number
): Promise<any> {
  return await Contact.findByProviderUserThreadId(schema, id);
}

/**
 * Updates by id.
 *
 * @param id number
 * @param params object
 */
export async function updateById(schema: string, id: number, params: any) {
  logger.log('info', `Update contact with id ${id} with parameters ${params}`);

  return await Contact.updateContact(schema, { id }, params);
}
