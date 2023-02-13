import Joi from 'joi';

/**
 * Default expiration validator.
 */
const defaultAccessExpirationValidator: any = Joi.object({
  isDefaultExpirySet: Joi.boolean().label('isDefaultExpirySet').required(),
  defaultExpiryDuration: Joi.when('isDefaultExpirySet', {
    is: true,
    then: Joi.number().greater(0).required(),
    otherwise: Joi.allow(null)
  })
});

export { defaultAccessExpirationValidator };
