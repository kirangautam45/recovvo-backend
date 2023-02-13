import { CLIENT_DOMAIN_IDS } from './contact.filter';
import Table from '../../common/enums/table.enum';

/**
 * Filter by client domain ids.
 *
 * @param queryBuilder
 * @param filter
 */
export const filterByClientDomainIds = (queryBuilder: any, filter: any) => {
  if (!(CLIENT_DOMAIN_IDS in filter) || filter[CLIENT_DOMAIN_IDS].length == 0)
    return queryBuilder;

  queryBuilder.whereIn(
    `${Table.CLIENT_DOMAIN_CONTACTS}.client_domain_id`,
    filter[CLIENT_DOMAIN_IDS]
  );

  return queryBuilder;
};
