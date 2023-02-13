import { PRIMARY_SEARCH } from './contact.filter';
import Table from '../../common/enums/table.enum';

/**
 * Contact search.
 *
 * @param queryBuilder
 * @param filter
 */
export const primarySearch = (queryBuilder: any, filter: any) => {
  if (!(PRIMARY_SEARCH in filter) || filter[PRIMARY_SEARCH] == '')
    return queryBuilder;

  queryBuilder.where((builder: any) => {
    builder
      .where(
        `${Table.CLIENT_DOMAIN_CONTACTS}.email`,
        'ilike',
        `%${filter[PRIMARY_SEARCH]}%`
      )
      .orWhere(
        `${Table.CLIENT_DOMAINS}.domain`,
        'ilike',
        `%${filter[PRIMARY_SEARCH]}%`
      )
      .orWhere(
        `${Table.CLIENT_DOMAIN_CONTACTS}.first_name`,
        'ilike',
        `%${filter[PRIMARY_SEARCH]}%`
      )
      .orWhere(
        `${Table.CLIENT_DOMAIN_CONTACTS}.last_name`,
        'ilike',
        `%${filter[PRIMARY_SEARCH]}%`
      )
      .orWhereRaw(
        `CONCAT(${Table.CLIENT_DOMAIN_CONTACTS}.first_name, ${Table.CLIENT_DOMAIN_CONTACTS}.last_name) ilike ?`,
        [`%${filter[PRIMARY_SEARCH].split(' ').join('')}%`]
      );
  });

  return queryBuilder;
};
