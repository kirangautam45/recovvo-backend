import logger from '../../core/utils/logger';
import Provider from './provider.model';
import IProvider from './interfaces/provider.interface';
import ProviderPayload from './dto/providerPayload.dto';

/**
 * Create provider
 *
 * @param {ProviderPayload} providerPayload
 */
export async function create(
  schema: string,
  providerPayload: ProviderPayload
): Promise<IProvider> {
  logger.log('info', 'Creating provider', providerPayload);

  const [provider] = await Provider.create(schema, providerPayload);

  return provider;
}

/**
 * Update provider
 *
 * @param id number
 * @returns Promise
 */
export async function update(
  schema: string,
  searchParams: any,
  updateParams: any
): Promise<IProvider> {
  logger.log(
    'info',
    'Updating provider information',
    searchParams,
    updateParams
  );
  const [provider] = await Provider.updateProviders(
    schema,
    searchParams,
    updateParams
  );

  return provider;
}

/**
 * Find one provider by query
 *
 * @param query object
 */

export async function findOne(
  schema: string,
  query: any
): Promise<IProvider | null> {
  logger.log('info', 'Fetching provider by query from database', query);
  const [provider] = await Provider.find(query).withSchema(schema).limit(1);
  return provider;
}
