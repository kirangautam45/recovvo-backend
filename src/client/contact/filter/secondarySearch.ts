import { SECONDARY_SEARCH } from './contact.filter';
import Table from '../../common/enums/table.enum';

/**
 * Secondary search.
 *
 * @param queryBuilder
 * @param filter
 */
export const secondarySearch = (queryBuilder: any, filter: any) => {
  if (!(SECONDARY_SEARCH in filter) || filter[SECONDARY_SEARCH] == '')
    return queryBuilder;

  queryBuilder.where((builder: any) => {
    builder
      .where(
        `${Table.CLIENT_DOMAIN_CONTACTS}.email`,
        'ilike',
        `%${filter[SECONDARY_SEARCH]}%`
      )
      .orWhere(
        `${Table.CLIENT_DOMAIN_CONTACTS}.first_name`,
        'ilike',
        `%${filter[SECONDARY_SEARCH]}%`
      )
      .orWhere(
        `${Table.CLIENT_DOMAIN_CONTACTS}.last_name`,
        'ilike',
        `%${filter[SECONDARY_SEARCH]}%`
      );
  });

  return queryBuilder;
};
