import Joi from 'joi';

/**
 * Organization Data validator.
 */

export const organizationValidator: any = Joi.object({
  organizationUrl: Joi.string().label('OrganizationUrl').allow('', null),
  organizationName: Joi.string().label('OrganizationName').allow('', null),
  userPosition: Joi.string().label('UserPosition').allow('', null),
  userDepartment: Joi.string().label('UserDepartment').allow('', null),
  organizationSize: Joi.string().label('OperationSize').allow('', null),
  industry: Joi.string().label('Industry').allow('', null)
});
