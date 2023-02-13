import JoiBase from 'joi';
import JoiDate from '@joi/date';

import { DEFAULT_DATE_FORMAT } from '../../common/constants/dateTimeConstants';

const Joi = JoiBase.extend(JoiDate);

/**
 * Add alias user schema.
 */
const addAliasValidator: any = Joi.object({
  aliasEmails: Joi.array().items(Joi.string()).required(),
  isCustomAccessDurationSet: Joi.boolean().required(),
  aliasStartDate: Joi.when('isCustomAccessDurationSet', {
    is: true,
    then: Joi.date().format(DEFAULT_DATE_FORMAT).required()
  }),
  aliasEndDate: Joi.when('isCustomAccessDurationSet', {
    is: true,
    then: Joi.date()
      .format(DEFAULT_DATE_FORMAT)
      .greater(Joi.ref('aliasStartDate'))
      .required()
  }),
  historicalEmailAccessStartDate: Joi.date()
    .format(DEFAULT_DATE_FORMAT)
    .required(),
  historicalEmailAccessEndDate: Joi.date()
    .format(DEFAULT_DATE_FORMAT)
    .greater(Joi.ref('historicalEmailAccessStartDate'))
    .required()
});

const aliasSchema = Joi.object({
  aliasEmail: Joi.string().email().required(),
  isCustomAccessDurationSet: Joi.boolean().required(),
  aliasStartDate: Joi.when('isCustomAccessDurationSet', {
    is: true,
    then: Joi.date().format(DEFAULT_DATE_FORMAT).required()
  }),
  aliasEndDate: Joi.when('isCustomAccessDurationSet', {
    is: true,
    then: Joi.date()
      .format(DEFAULT_DATE_FORMAT)
      .min(Joi.ref('aliasStartDate'))
      .allow(null)
  }),
  historicalEmailAccessStartDate: Joi.date()
    .format(DEFAULT_DATE_FORMAT)
    .required(),
  historicalEmailAccessEndDate: Joi.date()
    .format(DEFAULT_DATE_FORMAT)
    .greater(Joi.ref('historicalEmailAccessStartDate'))
    .required()
});

const bulkAliasSchema: any = aliasSchema.append({
  userEmail: Joi.string().email().required()
});

/**
 * Remove alias schema
 */
const removeAliasValidator: any = Joi.object({
  aliasEmail: Joi.string().email().required()
});

/**
 * Remove all alias schema
 */
const removeAllAliasValidator: any = Joi.object({
  aliasEmails: Joi.array().items(Joi.string().allow('')).required()
});

/**
 * Update alias email access date user schema
 */
const updateAliasAccessValidator: any = Joi.object({
  aliasEmail: Joi.string().label('aliasEmail').required(),
  isCustomAccessDurationSet: Joi.boolean().required(),
  aliasStartDate: Joi.when('isCustomAccessDurationSet', {
    is: true,
    then: Joi.date().format(DEFAULT_DATE_FORMAT).required()
  }),
  aliasEndDate: Joi.when('isCustomAccessDurationSet', {
    is: true,
    then: Joi.date()
      .format(DEFAULT_DATE_FORMAT)
      .greater(Joi.ref('aliasStartDate'))
      .required()
  }),
  historicalEmailAccessStartDate: Joi.date()
    .format(DEFAULT_DATE_FORMAT)
    .required(),
  historicalEmailAccessEndDate: Joi.date()
    .format(DEFAULT_DATE_FORMAT)
    .greater(Joi.ref('historicalEmailAccessStartDate'))
    .required()
});

/**
 * Update alias historical email access date user schema
 */
const updateAliasEmailAccessDateValidator: any = Joi.object({
  aliasEmail: Joi.string().required()
});

export {
  aliasSchema,
  bulkAliasSchema,
  addAliasValidator,
  removeAliasValidator,
  removeAllAliasValidator,
  updateAliasAccessValidator,
  updateAliasEmailAccessDateValidator
};
