import Joi from 'joi';

/**
 * Adds supervisor schema.
 */
const addSupervisorValidator: any = Joi.object({
  supervisorEmails: Joi.array()
    .label('SupervisorEmails')
    .items(Joi.string())
    .required()
});

/**
 * Removes supervisor schema
 */
const removeSupervisorValidator: any = Joi.object({
  supervisorEmail: Joi.string().label('SupervisorEmail').required()
});

export { addSupervisorValidator, removeSupervisorValidator };
