import logger from '../../core/utils/logger';
import ClientDomainUserMapping from './clientDomainUserMapping.model';
import IClientDomainUserMapping from './interfaces/clientDomainUserMapping.interface';

/**
 * Fetch all client domain user mappings from database
 *
 * @returns Promise
 */
export async function fetchAll(
  schema: string
): Promise<IClientDomainUserMapping[]> {
  logger.log('info', 'Fetching client domain user mappings from database');

  return ClientDomainUserMapping.find().withSchema(schema);
}

/**
 * Fetch list of mapped client domains with filtered query of a user.
 *
 * @returns Promise
 */
export async function fetchMappedDomainsWithFilter(
  schema: string,
  providerUserId: any,
  filter: any
): Promise<any> {
  logger.info('Fetching client domain user mappings from database');

  return ClientDomainUserMapping.filterMappedDomainsUser(
    schema,
    providerUserId,
    filter
  );
}

/**
 * Find client domain user mapping by query
 *
 * @param query object
 */
export async function find(
  schema: string,
  query: any
): Promise<IClientDomainUserMapping[]> {
  logger.log(
    'info',
    'Fetching client domain user mapping by query from database',
    query
  );
  return await ClientDomainUserMapping.find(query).withSchema(schema);
}

/**
 * Find one client domain user mapping by query
 *
 * @param query object
 */
export async function findOne(
  schema: string,
  query: any
): Promise<IClientDomainUserMapping | null> {
  logger.log(
    'info',
    'Fetching one client domain user mapping by query from database',
    query
  );
  return await ClientDomainUserMapping.findFirstRecord(schema, query);
}

/**
 * Find client domain user mapping by query
 *
 * @param id number
 */
export async function findById(
  schema: string,
  id: number
): Promise<IClientDomainUserMapping | null> {
  logger.log(
    'info',
    'Fetching client domain user mapping by id from database',
    id
  );
  return await ClientDomainUserMapping.find({ id }).withSchema(schema);
}

/**
 * Find client domain user mapping by query
 *
 * @param searchQuery object
 * @param updateQuery object
 */
export async function update(
  schema: string,
  searchQuery: any,
  updateQuery: any
): Promise<IClientDomainUserMapping[] | null> {
  logger.log(
    'info',
    'Updating client domain user mapping from database',
    searchQuery,
    updateQuery
  );
  return await ClientDomainUserMapping.updateMapping(
    schema,
    searchQuery,
    updateQuery
  );
}

/**
 * Create client domain user mapping
 * @param clientDomainUserPayload object
 */
export async function create(
  schema: string,
  clientDomainUserPayload: any
): Promise<IClientDomainUserMapping> {
  logger.log(
    'info',
    'Creating new client domain user mapping',
    clientDomainUserPayload
  );

  const [clientDomain] = await ClientDomainUserMapping.create(
    schema,
    clientDomainUserPayload
  );

  return clientDomain;
}

/**
 * List of client domain user mapping by provider user ids.
 *
 * @param providerUserIds number[]
 */
export async function findByProviderUserIdIn(
  schema: string,
  providerUserIds: number[]
): Promise<IClientDomainUserMapping[]> {
  logger.log(
    'info',
    'Fetching client domain user mapping by list of provider user ids from database %s',
    providerUserIds
  );
  return await ClientDomainUserMapping.findByProviderUserIdIn(
    schema,
    providerUserIds
  );
}
