import Joi from 'joi';

/**
 * contact update schema.
 */
const updateValidator: any = Joi.object({
  firstName: Joi.string().label('FirstName').allow('', null),

  lastName: Joi.string().label('LastName').allow('', null),

  position: Joi.string().label('Position').allow('', null),

  workPhoneNumber: Joi.string().label('WorkPhoneNumber').allow('', null),

  cellPhoneNumber: Joi.string().label('CellPhoneNumber').allow('', null),

  address: Joi.string().label('Address').allow('', null),

  companyName: Joi.string().label('CompanyName').allow('', null)
});

// Contact update fields
const ContactFields: { [key: string]: string } = {
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  POSITION: 'position',
  WORK_PHONE_NUMBER: 'workPhoneNumber',
  CELL_PHONE_NUMBER: 'cellPhoneNumber',
  ADDRESS: 'address',
  COMPANY_NAME: 'companyName'
};

export { updateValidator, ContactFields };
