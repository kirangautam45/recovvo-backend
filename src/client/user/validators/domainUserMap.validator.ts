import Joi from 'joi';

/**
 * Client Domain Mapping Schema.
 */

export const domainUserMapValidator: any = Joi.object({
  domainUrls: Joi.array().required()
});

/**
 * Client Domain Mapping Schema.
 */

export const domainUserUnmapValidator: any = Joi.object({
  domainId: Joi.number().required()
});
