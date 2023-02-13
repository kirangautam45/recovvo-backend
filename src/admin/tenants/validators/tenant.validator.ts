import Joi from 'joi';

/**
 * tenant create schema.
 */
const createValidator: any = Joi.object({
  organizationName: Joi.string().label('OrganizationName'),

  organizationAdminFirstName: Joi.string().label('OrganizationAdminFirstName'),

  organizationAdminLastName: Joi.string().label('OrganizationAdminLastName'),

  organizationAdminEmail: Joi.string()
    .label('OrganizationAdminEmail')
    .email()
    .required()
});

/**
 * tenant update schema
 */
const updateValidator: any = Joi.object({
  organizationName: Joi.string().label('OrganizationName'),

  organizationAdminFirstName: Joi.string().label('OrganizationAdminFirstName'),

  organizationAdminLastName: Joi.string().label('OrganizationAdminLastName'),

  organizationAdminEmail: Joi.string()
    .label('OrganizationAdminEmail')
    .required(),

  isActive: Joi.boolean().label('IsActive')
});

export { createValidator, updateValidator };
