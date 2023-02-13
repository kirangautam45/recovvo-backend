import logger from '../../core/utils/logger';
import UserSenderReceiverAssociation from './userSenderReceiverAssociation.model';
import IUserSenderReceiverAssociation from './interfaces/userSenderReceiverAssociation.interface';

/**
 * Find user sender receiver association.
 *
 * @returns Promise
 */
export async function find(
  schema: string,
  query: any
): Promise<IUserSenderReceiverAssociation[]> {
  logger.log(
    'info',
    'Fetching user sender receiver assocation by %s from database',
    JSON.stringify(query)
  );
  return await UserSenderReceiverAssociation.find(query)
    .withSchema(schema)
    .pluck('client_domain_id');
}

/**
 * Find the client domain ids from provider users within certain range
 */
export async function findClientIdsByProviderUserFromTimeRange(
  schema: string,
  providerUserIds: number[],
  accessStartDate?: any,
  accessEndDate?: any
) {
  const clientContactDetails = await UserSenderReceiverAssociation.findClientDominIdsFromUser(
    schema,
    providerUserIds,
    accessStartDate,
    accessEndDate
  );

  return clientContactDetails;
}
