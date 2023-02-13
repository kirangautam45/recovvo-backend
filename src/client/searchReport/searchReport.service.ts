import moment from 'moment';

import logger from '../../core/utils/logger';
import SearchReport from './searchReport.model';
import Queue from '../common/utils/BufferedQueue';
import { DESC, ASC } from './searchReport.constants';
import { ITimeRange } from './searchReport.interface';
import * as searchReportDao from './searchReport.dao';
import { convertJsonToCSV } from '../../core/utils/csv';
import { paginateData, getPageParams } from '../../core/utils/recovoUtils';
import { DEFAULT_DATE_FORMAT } from '../common/constants/dateTimeConstants';

import {
  searchReportDownloadHeaders,
  searchReportDownloadValidators
} from './validators/csv.validator';
import {
  FLUSH_RECOVVO_QUEUE,
  QUEUE_FLUSHTIMEOUT,
  QUEUE_SIZE
} from '../common/constants/bufferedQueueConstants';

export const queueSearchReport = new Queue('search-report-formatted', {
  size: QUEUE_SIZE,
  flushTimeout: QUEUE_FLUSHTIMEOUT
});

export type SearchReportQueryType = {
  createdAtFrom?: string;
  createdAtTo?: string;
  sort?: { order: DESC | ASC; sortBy: string }[];
};

queueSearchReport.on(FLUSH_RECOVVO_QUEUE, function (data: any) {
  logger.log('info', `EventLog::Added data to the search report queue.`);
  data.forEach(async (item: any) => {
    const { tenantName, searchByUser } = item;
    await insertOrUpdateSearchReport(tenantName, searchByUser);
  });
});

export async function insertOrUpdateSearchReport(
  schema: string,
  data: { [key: string]: any }
) {
  try {
    await SearchReport.insert(data).withSchema(schema);
  } catch (err) {
    throw err;
  }
}

/**
 * Gets search report with pagination.
 *
 * @param schema string
 * @param query SearchReportQueryType
 * @returns any
 */
export async function fetchSearchReport(
  schema: string,
  query: SearchReportQueryType
): Promise<any> {
  const { sort, createdAtFrom, createdAtTo } = query;

  const pageParams = getPageParams(query);

  let timeRange = {};
  if (createdAtFrom || createdAtTo) {
    timeRange = {
      createdAtFrom:
        createdAtFrom &&
        moment(createdAtFrom, DEFAULT_DATE_FORMAT).format(DEFAULT_DATE_FORMAT), // format specified in moment object to avoid deprecation warning
      createdAtTo:
        createdAtTo &&
        moment(createdAtTo, DEFAULT_DATE_FORMAT).format(DEFAULT_DATE_FORMAT)
    };
  }

  const searchReport = await searchReportDao.fetchPaginatedSearchReport(
    schema,
    pageParams,
    timeRange,
    sort
  );

  const total = await searchReportDao.countAll(schema, timeRange);

  return paginateData(searchReport, pageParams, total);
}

/**
 * Downloads csv with search report.
 *
 * @param { String } schema
 * @param { Object } timeRange
 * @returns CSV
 */
export async function downloadSearchReportCSV(
  schema: string,
  timeRange: ITimeRange
): Promise<any> {
  const searchReports = await searchReportDao.fetchAllSearchReport(
    schema,
    timeRange
  );

  let searchReportJson: { [key: string]: any }[] = [];

  searchReports &&
    searchReports.map((searchReport: any) => {
      searchReportJson = [
        ...searchReportJson,
        {
          [searchReportDownloadHeaders.user]: searchReport?.user,
          [searchReportDownloadHeaders.department]: searchReport?.department,
          [searchReportDownloadHeaders.primarySearch]:
            searchReport?.primarySearch,
          [searchReportDownloadHeaders.secondarySearch]:
            searchReport?.secondarySearch,
          [searchReportDownloadHeaders.searched]: searchReport?.searched,
          [searchReportDownloadHeaders.searchDate]:
            moment(searchReport?.createdAt).format('MMM DD, YYYY, h:mm a') ||
            '-'
        }
      ];
    });

  return convertJsonToCSV(searchReportDownloadValidators, searchReportJson);
}
