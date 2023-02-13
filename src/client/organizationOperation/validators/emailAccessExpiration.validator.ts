import JoiBase from 'joi';
import JoiDate from '@joi/date';

import { DEFAULT_DATE_FORMAT } from '../../common/constants/dateTimeConstants';

const Joi = JoiBase.extend(JoiDate);

/**
 * Email access expiration validator
 */
const emailAccessExpirationValidator: any = Joi.object({
  isEmailAccessTimeFrameSet: Joi.boolean().required(),
  isRollingTimeFrameSet: Joi.boolean().required(),
  emailAccessStartDate: Joi.when('isEmailAccessTimeFrameSet', {
    is: true,
    then: Joi.date().less('now').format(DEFAULT_DATE_FORMAT).required(),
    otherwise: Joi.any()
  })
});

export { emailAccessExpirationValidator };
