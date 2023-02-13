import Joi from 'joi';

/**
 * User update schema.
 */
const updateValidator: any = Joi.object({
  firstName: Joi.string().label('FirstName'),

  middleName: Joi.string().label('MiddleName').allow('', null),

  lastName: Joi.string().label('LastName'),

  phoneNumbers: Joi.array().label('PhoneNumbers').items(Joi.string()),

  role: Joi.string().label('Role'),

  department: Joi.string().label('Department')
});

export { updateValidator };
