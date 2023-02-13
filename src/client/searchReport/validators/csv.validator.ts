/**
 * Search Report csv download schema.
 */
export const searchReportDownloadHeaders = {
  user: 'User',
  department: 'Department',
  primarySearch: 'PrimarySearch',
  secondarySearch: 'SecondarySearch',
  searched: 'Searched',
  searchDate: 'SearchDate(MM-DD-YYYY)'
};

/**
 * Search Report validator.
 */
export const searchReportDownloadValidators: string[] = [
  searchReportDownloadHeaders.user,
  searchReportDownloadHeaders.department,
  searchReportDownloadHeaders.primarySearch,
  searchReportDownloadHeaders.secondarySearch,
  searchReportDownloadHeaders.searched,
  searchReportDownloadHeaders.searchDate
];
