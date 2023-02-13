import Joi from 'joi';

/**
 * Client Domain Validator.
 */
const clientDomainValidator: any = Joi.object({
  domainUrls: Joi.array().label('DomainUrls').items(Joi.string()).required()
});

export { clientDomainValidator };
