import ClientDomain from './clientDomain.model';
import logger from '../../core/utils/logger';
import IClientDomain from './interfaces/clientDomain.interface';

/**
 * Create client domain.
 *
 * @param clientDomainPayload object
 */
export async function create(
  schema: string,
  clientDomainPayload: any
): Promise<IClientDomain> {
  logger.log('info', 'Creating new client domain', clientDomainPayload);

  const [clientDomain] = await ClientDomain.create(schema, clientDomainPayload);

  return clientDomain;
}

/**
 * Fetch all client domains from database.
 *
 * @returns Promise
 */
export async function fetchAll(schema: string): Promise<IClientDomain[]> {
  logger.log('info', 'Fetching client domains from database');

  return ClientDomain.find().withSchema(schema);
}

/**
 * Finds client domains.
 *
 */
export async function find(
  schema: string,
  query: any
): Promise<IClientDomain[]> {
  logger.log('info', 'Fetching client domain by query from database', query);
  return await ClientDomain.find(query).withSchema(schema);
}

/**
 * Filters client domains by filter.
 *
 * @param query any
 * @param filter any
 */
export async function filterDomains(
  schema: string,
  filter: any
): Promise<IClientDomain[]> {
  logger.log(
    'info',
    'Fetching client domain by applying filter from database',
    filter
  );
  return await ClientDomain.filterClientDomains(schema, filter);
}

/**
 * Finds one client domain by query.
 *
 * @param query object
 */
export async function findOne(
  schema: string,
  query: any
): Promise<IClientDomain | null> {
  logger.log(
    'info',
    'Fetching one client domain by query from database',
    query
  );
  return await ClientDomain.findFirstRecord(schema, query);
}

/**
 * Finds client domain by id.
 *
 * @param id number
 */
export async function findById(
  schema: string,
  id: number
): Promise<IClientDomain | null> {
  logger.log('info', 'Fetching client domain by id from database', id);
  return await ClientDomain.findById(schema, id);
}

/**
 * Updates client domain by query.
 *
 * @param searchQuery object
 * @param updateQuery object
 */
export async function update(
  schema: string,
  searchQuery: any,
  updateQuery: any
): Promise<IClientDomain[] | null> {
  logger.log(
    'info',
    'Updating client domain from database',
    searchQuery,
    updateQuery
  );
  return await ClientDomain.updateClientDomain(
    schema,
    searchQuery,
    updateQuery
  );
}

/***
 * Finds client domain by domains in.
 *
 * @param schema string
 * @param domains string[]
 * @returns ids of client domains
 */
export async function findByDomainsIn(schema: string, domains: string[]) {
  return ClientDomain.findByDomainsIn(schema, domains);
}
