import JoiBase from 'joi';
import JoiDate from '@joi/date';

import { DEFAULT_DATE_FORMAT } from '../common/constants/dateTimeConstants';

const Joi = JoiBase.extend(JoiDate);

export const UsageReportDateFilterValidator: any = Joi.object({
  createdAtSince: Joi.date().format(DEFAULT_DATE_FORMAT),
  createdAtUntil: Joi.date().format(DEFAULT_DATE_FORMAT)
});
