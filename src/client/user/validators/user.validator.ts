import Joi from 'joi';

/**
 * Manual user upload schema.
 */
const userValidator: any = Joi.object({
  emails: Joi.array().label('Emails').items(Joi.string()).required()
});

export { userValidator };
