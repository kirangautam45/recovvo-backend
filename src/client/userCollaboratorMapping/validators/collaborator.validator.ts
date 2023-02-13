import JoiBase from 'joi';
import JoiDate from '@joi/date';

import { DEFAULT_DATE_FORMAT } from '../../common/constants/dateTimeConstants';

const Joi = JoiBase.extend(JoiDate);

/**
 * Add collaborator schema.
 */
const addOrUpdateCollaboratorsValidator: any = Joi.object({
  collaboratorEmails: Joi.array()
    .label('CollaboratorEmails')
    .items(Joi.string())
    .required(),
  isCustomAccessDurationSet: Joi.boolean().required(),
  accessStartDate: Joi.when('isCustomAccessDurationSet', {
    is: true,
    then: Joi.date().format(DEFAULT_DATE_FORMAT).required()
  }),
  accessEndDate: Joi.when('isCustomAccessDurationSet', {
    is: true,
    then: Joi.date().format(DEFAULT_DATE_FORMAT).min(Joi.ref('accessStartDate'))
  })
});

/**
 * Remove collaborator schema
 */
const removeCollaboratorValidator: any = Joi.object({
  collaboratorEmail: Joi.string().email().label('CollaboratorEmail').required()
});

export { addOrUpdateCollaboratorsValidator, removeCollaboratorValidator };
