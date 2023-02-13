import registerFilters from './registerFilters';

export const PRIMARY_SEARCH = 'primarySearch';
export const CLIENT_DOMAIN_IDS = 'clientDomainIds';
export const HAS_ATTACHMENTS = 'hasAttachments';
export const HAS_CLIENT_RESPONSES = 'hasClientResponses';
export const START_DATE = 'startDate';
export const END_DATE = 'endDate';
export const LAST_CONTACT_DATE = 'lastContactDate';

export const SECONDARY_SEARCH = 'secondarySearch';
export const CLIENT_CONTACT_IDS = 'clientContactIds';
export const PERSONAL_EMAILS_FILTER = 'personalEmailsFilter';

/**
 * Default Search params
 */
export const SEARCH_PARAMS = [
  PRIMARY_SEARCH,
  CLIENT_DOMAIN_IDS,
  CLIENT_CONTACT_IDS,
  HAS_ATTACHMENTS,
  HAS_CLIENT_RESPONSES,
  START_DATE,
  END_DATE
];

export const contactFilter = async (
  schema: string,
  queryBuilder: any,
  filter: any,
  searchParams = SEARCH_PARAMS
) => {
  let hqb = Promise.resolve({ queryBuilder });

  const filterQuery = Promise.all(
    searchParams.map(async (param: string) => {
      const qb = (await hqb).queryBuilder;
      hqb = (await registerFilters(schema, qb, filter, param)).queryBuilder;
      return { queryBuilder: hqb };
    })
  );

  return {
    queryBuilder: (await filterQuery)[searchParams.length - 1].queryBuilder
  };
};
