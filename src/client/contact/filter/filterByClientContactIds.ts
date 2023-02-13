import Table from '../../common/enums/table.enum';
import { CLIENT_CONTACT_IDS } from './contact.filter';

/**
 * Filter by client domain ids.
 *
 * @param queryBuilder
 * @param filter
 */
export const filterByClientContactIds = (queryBuilder: any, filter: any) => {
  if (!(CLIENT_CONTACT_IDS in filter) || filter[CLIENT_CONTACT_IDS].length == 0)
    return queryBuilder;

  queryBuilder.whereIn(
    `${Table.CLIENT_DOMAIN_CONTACTS}.id`,
    filter[CLIENT_CONTACT_IDS]
  );

  return queryBuilder;
};
