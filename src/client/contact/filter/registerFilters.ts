import Knex from 'knex';

import {
  START_DATE,
  PRIMARY_SEARCH,
  HAS_ATTACHMENTS,
  SECONDARY_SEARCH,
  CLIENT_DOMAIN_IDS,
  CLIENT_CONTACT_IDS,
  HAS_CLIENT_RESPONSES
} from './contact.filter';
import { primarySearch } from './primarySearch';
import { secondarySearch } from './secondarySearch';
import { filterByAttachments } from './filterByAttachments';
import { filterByLastContactDate } from './filterByLastContactDate';
import { filterByClientDomainIds } from './filterByClientDomainIds';
import { filterByClientResponses } from './filterByClientResponses';
import { filterByClientContactIds } from './filterByClientContactIds';

const formatQbToObject = (qb: Knex.QueryBuilder) => ({ queryBuilder: qb });

/**
 * Register filters here.
 */
const registerFilters = async (
  schema: string,
  queryBuilder: Knex.QueryBuilder,
  filter: any,
  param: string
): Promise<Knex.QueryBuilder> => {
  switch (param) {
    case PRIMARY_SEARCH:
      return formatQbToObject(primarySearch(queryBuilder, filter));
    case SECONDARY_SEARCH:
      return formatQbToObject(secondarySearch(queryBuilder, filter));
    case CLIENT_DOMAIN_IDS:
      return formatQbToObject(filterByClientDomainIds(queryBuilder, filter));
    case CLIENT_CONTACT_IDS:
      return formatQbToObject(filterByClientContactIds(queryBuilder, filter));
    case HAS_ATTACHMENTS:
      const hqb = (await filterByAttachments(schema, queryBuilder, filter))
        .queryBuilder;

      return formatQbToObject(hqb);
    case HAS_CLIENT_RESPONSES:
      return formatQbToObject(
        (await filterByClientResponses(schema, queryBuilder, filter))
          .queryBuilder
      );
    case START_DATE:
      return formatQbToObject(
        filterByLastContactDate(schema, queryBuilder, filter)
      );
    default:
      return { queryBuilder };
  }
};

export default registerFilters;
