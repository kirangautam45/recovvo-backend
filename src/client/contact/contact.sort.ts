const CLIENT_NAME = 'CLIENT_NAME';

/**
 * Contact sorting.
 *
 * @param queryBuilder
 * @param sortParams
 */
export const contactSort = (
  queryBuilder: any,
  sortParams: { field: string; direction: string }
) => {
  const COLUMN_INDEX: any = {
    CLIENT_REPLIES: 10,
    RECENTLY_CONTACTED: 8,
    OUTBOUND_CONTACTS: 9,
    CLIENT_NAME: 2
  };

  if (sortParams.field in COLUMN_INDEX) {
    const nullLast = sortParams.field == CLIENT_NAME ? 'NULLS LAST' : '';
    return queryBuilder.orderByRaw(
      `${COLUMN_INDEX[sortParams.field]} ${sortParams.direction} ${nullLast}`
    );
  }

  return queryBuilder;
};
