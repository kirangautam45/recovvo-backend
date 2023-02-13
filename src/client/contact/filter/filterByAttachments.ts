import Knex from 'knex';

import { HAS_ATTACHMENTS } from './contact.filter';
import UserSenderReceiverAssociation from '../../userSenderReceiverAssociation/userSenderReceiverAssociation.model';

/**
 * Filter by attachments
 *
 * @param queryBuilder
 * @param filter
 */
export const filterByAttachments = async (
  schema: string,
  queryBuilder: Knex.QueryBuilder,
  filter: any
): Promise<Knex.QueryBuilder> => {
  if (!(HAS_ATTACHMENTS in filter)) return { queryBuilder };

  const hqb = (
    await UserSenderReceiverAssociation.contactAttachmentCountSubQuery(schema)
  ).queryBuilder;

  if (filter[HAS_ATTACHMENTS] == 'true') {
    queryBuilder.where(0, '<', hqb);
  }

  if (filter[HAS_ATTACHMENTS] == 'false') {
    queryBuilder.where(0, hqb);
  }

  return { queryBuilder };
};
