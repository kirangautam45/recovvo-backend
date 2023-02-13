const FILE_NAME = 'FILE_NAME';

/**
 * Attachment sorting.
 *
 * @param queryBuilder
 * @param sortParams
 */
export const attachmentSort = (
  queryBuilder: any,
  sortParams: { field: string; direction: string }
) => {
  const COLUMN_INDEX: any = {
    RECENT_DOCUMENTS: 9,
    FILE_NAME: 2
  };

  if (sortParams.field in COLUMN_INDEX) {
    const nullLast = sortParams.field == FILE_NAME ? 'NULLS LAST' : '';
    return queryBuilder.orderByRaw(
      `${COLUMN_INDEX[sortParams.field]} ${sortParams.direction} ${nullLast}`
    );
  }

  return queryBuilder;
};
