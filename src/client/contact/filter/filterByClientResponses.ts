import Knex from 'knex';

import { HAS_CLIENT_RESPONSES } from './contact.filter';
import UserSenderReceiverAssociation from '../../userSenderReceiverAssociation/userSenderReceiverAssociation.model';

/**
 * Filter by client responses.
 *
 * @param queryBuilder
 * @param filter
 */
export const filterByClientResponses = async (
  schema: string,
  queryBuilder: Knex.QueryBuilder,
  filter: any
): Promise<Knex.QueryBuilder> => {
  if (!(HAS_CLIENT_RESPONSES in filter)) return queryBuilder;

  const hqb = (
    await UserSenderReceiverAssociation.totalReplyCountSubQuery(schema)
  ).queryBuilder;

  if (filter[HAS_CLIENT_RESPONSES] == 'true') {
    queryBuilder.where(0, '<', hqb);
  }

  if (filter[HAS_CLIENT_RESPONSES] == 'false') {
    queryBuilder.where(0, hqb);
  }
  return queryBuilder;
};
