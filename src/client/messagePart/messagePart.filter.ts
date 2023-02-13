import { ROOT_MESSAGE_PARTS } from './messagePart.constants';
import Table from '../common/enums/table.enum';

const SECONDARY_SEARCH = 'secondarySearch';

/**
 * Attachment sorting.
 *
 * @param queryBuilder
 * @param sortParams
 */
export const messagePartFilter = (queryBuilder: any, filter: any) => {
  if (!(SECONDARY_SEARCH in filter) || filter[SECONDARY_SEARCH] == '')
    return queryBuilder;

  queryBuilder.where((builder: any) => {
    builder
      .where(
        `${Table.MESSAGE_PARTS}.file_name`,
        'ilike',
        `%${filter[SECONDARY_SEARCH]}%`
      )
      .orWhere(
        `${ROOT_MESSAGE_PARTS}.part_from`,
        'ilike',
        `%${filter[SECONDARY_SEARCH]}%`
      )
      .orWhere(
        `${ROOT_MESSAGE_PARTS}.part_to`,
        'ilike',
        `%${filter[SECONDARY_SEARCH]}%`
      );
  });

  return queryBuilder;
};
