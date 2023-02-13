/**
 * Alias mapping csv upload schema.
 */
export const aliasMappingHeaders = {
  aliasEmail: 'AliasEmail',
  accessStartDate: 'AccessStartDate(MM-DD-YYYY)',
  accessEndDate: 'AccessEndDate(MM-DD-YYYY)',
  historicalEmailAccessEndDate: 'HistoricalEmailAccessEndDate(MM-DD-YYYY)',
  historicalEmailAccessStartDate: 'HistoricalEmailAccessStartDate(MM-DD-YYYY)'
};

export const bulkAliasMappingHeaders = {
  userEmail: 'UserEmail',
  ...aliasMappingHeaders
};

export const aliasMappingValidators: string[] = [
  aliasMappingHeaders.aliasEmail,
  aliasMappingHeaders.accessStartDate,
  aliasMappingHeaders.accessEndDate,
  aliasMappingHeaders.historicalEmailAccessStartDate,
  aliasMappingHeaders.historicalEmailAccessEndDate
];

export const bulkAliasMappingValidators: string[] = [
  bulkAliasMappingHeaders.userEmail,
  bulkAliasMappingHeaders.aliasEmail,
  bulkAliasMappingHeaders.accessStartDate,
  bulkAliasMappingHeaders.accessEndDate,
  bulkAliasMappingHeaders.historicalEmailAccessStartDate,
  bulkAliasMappingHeaders.historicalEmailAccessEndDate
];

/**
 * Alias mapping csv download schema.
 */
export const aliasMappingDownloadHeaders = {
  userEmail: 'UserEmail',
  aliasEmail: 'AliasEmail',
  accessStartDate: 'AccessStartDate(MM-DD-YYYY)',
  accessEndDate: 'AccessEndDate(MM-DD-YYYY)',
  historicalEmailAccessEndDate: 'HistoricalEmailAccessEndDate(MM-DD-YYYY)',
  historicalEmailAccessStartDate: 'HistoricalEmailAccessStartDate(MM-DD-YYYY)'
};

export const aliasMappingDownloadValidators: string[] = [
  aliasMappingDownloadHeaders.userEmail,
  aliasMappingDownloadHeaders.aliasEmail,
  aliasMappingDownloadHeaders.accessStartDate,
  aliasMappingDownloadHeaders.accessEndDate,
  aliasMappingDownloadHeaders.historicalEmailAccessStartDate,
  aliasMappingDownloadHeaders.historicalEmailAccessEndDate
];
