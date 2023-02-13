import moment from 'moment';

import logger from '../../core/utils/logger';
import roleMapper from '../user/mapper/role.mapper';
import { UsageReportDateFilterValidator } from './usageReport.validator';
import UsageReport, { UsageReportWithRoleType } from './usageReport.model';

import {
  paginateData,
  getPageParams,
  PageParams
} from '../../core/utils/recovoUtils';
import { convertJsonToCSV } from '../../core/utils/csv';

import Queue from '../common/utils/BufferedQueue';
import { DEFAULT_DATE_TIME_FORMAT } from '../common/constants/dateTimeConstants';

import {
  usageReportHeaders,
  usageReportValidators
} from '../../client/clientDomain/validators/usageReportValidator';
import {
  FLUSH_RECOVVO_QUEUE,
  USAGE_REPORT_FORMATTED
} from '../common/constants/bufferedQueueConstants';

export type UsageReportQueryType = {
  pageSize?: string;
  pageNumber?: string;
  createdAtSince?: string;
  createdAtUntil?: string;
  sort?: { order: -1 | 1; sortBy: string }[];
};

export const queueUsageReport = new Queue(USAGE_REPORT_FORMATTED, {
  size: 10,
  flushTimeout: 2000
});

queueUsageReport.on(FLUSH_RECOVVO_QUEUE, function (data: any) {
  logger.log('info', `EventLog::Added data to usage report queue.`);

  data.forEach(async (item: any) => {
    const { tenantName, usageByUser } = item;

    const loggedByList = Object.keys(usageByUser).map((item) => Number(item));

    for (const eachLoggedUser of loggedByList) {
      insertOrUpdateUsageReport(tenantName, usageByUser[eachLoggedUser]);
    }
  });
});

/**
 * Fetch list of filtered reports with paginated data.
 */
export async function fetchAllWithPage(
  schema: string,
  query: UsageReportQueryType
): Promise<any> {
  const { sort } = query;

  const pageParams = getPageParams(query);

  const { createdAtSince, createdAtUntil } = query;

  const filterParams = {
    createdAtSince,
    createdAtUntil
  };

  const { error } = UsageReportDateFilterValidator.validate({
    createdAtSince,
    createdAtUntil
  });

  if (error) {
    throw error;
  }

  const reports = await UsageReport.fetchAllWithPagination(
    schema,
    pageParams,
    filterParams,
    sort
  );

  const totalStats = await UsageReport.fetchTotalUsageStateWithoutPagination(
    schema,
    filterParams
  );

  const totalCount = await UsageReport.countAll(schema, filterParams);

  return paginateData(reports, pageParams, totalCount, totalStats);
}

export async function downloadAll(schema: string, query: UsageReportQueryType) {
  const { sort } = query;

  const pageParams: PageParams = { page: 1, pageSize: 0 };

  const { createdAtSince, createdAtUntil } = query;

  const filterParams = {
    createdAtSince,
    createdAtUntil
  };

  const { error } = UsageReportDateFilterValidator.validate({
    createdAtSince,
    createdAtUntil
  });

  if (error) {
    throw error;
  }

  const reports = await UsageReport.fetchAllWithPagination(
    schema,
    pageParams,
    filterParams,
    sort
  );

  const reportsJsonData = reports
    .map(
      ({
        id,
        firstName,
        lastName,
        email,
        isAdmin,
        isSupervisor,
        department,
        lastSearch,
        searches,
        contactExports,
        attachmentExports
      }) =>
        ({
          id,
          name: `${firstName} ${lastName}`,
          email,
          role: isAdmin
            ? roleMapper.ADMIN
            : isSupervisor
            ? roleMapper.SUPERVISOR
            : roleMapper.USER,
          department,
          lastSearch: moment(lastSearch).format(DEFAULT_DATE_TIME_FORMAT),
          searches,
          contactExports,
          attachmentExports
        } as UsageReportWithRoleType)
    )
    .map((report) =>
      Object.keys(usageReportHeaders).map((prop) => (report as any)[prop])
    );

  return {
    csv: convertJsonToCSV(usageReportValidators, reportsJsonData),
    createdAtSince,
    createdAtUntil
  };
}

export async function insertOrUpdateUsageReport(schema: string, data: any) {
  try {
    logger.log(
      'info',
      `EventLog::Inserting data to the usage report table with schema ${schema}`
    );
    await UsageReport.pg_UpdateUsageReport(schema, data);
  } catch (err) {
    throw err;
  }
}
