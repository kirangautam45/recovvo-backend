import moment from 'moment';
import { DEFAULT_DATE_FORMAT } from '../../client/common/constants/dateTimeConstants';
import { UNLIMITED_ACCESS } from '../../client/organizationOperation/organizationOperation.constant';

/**
 * Takes dateTo and dateFrom and returns the time range in days else a default constant UNLIMITED_ACCESS
 * @param dateTo
 * @param dateFrom
 */
export const getTimeRangeInDays = (
  dateTo: string,
  dateFrom: string | null | undefined
): number => {
  if (!dateFrom) {
    return UNLIMITED_ACCESS;
  }

  return moment
    .duration(moment(dateTo, DEFAULT_DATE_FORMAT).diff(dateFrom))
    .asDays();
};

/**
 * Takes dateTo and dateFrom and returns the time range in years else a default constant UNLIMITED_ACCESS
 * @param dateTo
 * @param dateFrom
 */
export const getTimeRangeInYears = (
  dateTo: string,
  dateFrom: string | null | undefined
): number => {
  if (!dateFrom) {
    return UNLIMITED_ACCESS;
  }

  return moment
    .duration(moment(dateTo, DEFAULT_DATE_FORMAT).diff(dateFrom))
    .asYears();
};
