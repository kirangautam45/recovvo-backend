import JoiBase from 'joi';
import JoiDate from '@joi/date';

import { DEFAULT_DATE_FORMAT } from '../../common/constants/dateTimeConstants';

const Joi = JoiBase.extend(JoiDate);
/**
 * User collaborator mapping csv upload schema.
 */
export const csvHeaders = {
  collaboratorEmail: 'CollaboratorEmail',
  accessStartDate: 'AccessStartDate(MM-DD-YYYY)',
  accessEndDate: 'AccessEndDate(MM-DD-YYYY)'
};

export const userCollaboratorMappingCsvValidator: string[] = [
  csvHeaders.collaboratorEmail,
  csvHeaders.accessStartDate,
  csvHeaders.accessEndDate
];

/**
 * User collaborator bulk mapping csv upload schema.
 */
export const csvBulkMappingHeaders = {
  userEmail: 'UserEmail',
  ...csvHeaders
};

export const userCollaboratorBulkMappingCsvValidator: string[] = [
  csvBulkMappingHeaders.userEmail,
  csvBulkMappingHeaders.collaboratorEmail,
  csvBulkMappingHeaders.accessStartDate,
  csvBulkMappingHeaders.accessEndDate
];

/**
 * Collaborator mapping CSV Row schema
 */
export const collaboratorCSVRowSchema: any = Joi.object({
  collaboratorEmail: Joi.string()
    .label('CollaboratorEmails')
    .required()
    .email(),
  isCustomAccessDurationSet: Joi.boolean().required(),
  accessStartDate: Joi.when('isCustomAccessDurationSet', {
    is: true,
    then: Joi.date().format(DEFAULT_DATE_FORMAT).required()
  }),
  accessEndDate: Joi.when('accessStartDate', {
    is: Joi.exist().equal(null),
    then: Joi.date().format(DEFAULT_DATE_FORMAT).allow(null),
    otherwise: Joi.date()
      .format(DEFAULT_DATE_FORMAT)
      .allow(null)
      .min(Joi.ref('accessStartDate'))
  })
});

/**
 * Bulk Collaborator mapping CSV Row schema
 */
export const bulkCollaboratorMappingCSVRowSchema: any = collaboratorCSVRowSchema.append(
  {
    userEmail: Joi.string().label('CollaboratorEmails').required().email()
  }
);
