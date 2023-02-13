import Joi from 'joi';

import {
  emailOrderDirections,
  emailOrderFields
} from '../providerUserThread.model';

/**
 * Request query schema.
 */
const fetchEmailThreadsRequestQuerySchema: any = Joi.object({
  secondarySearch: Joi.string().label('Search Parameter').allow(''),

  emailsFrom: Joi.when('emailUpto', {
    is: Joi.exist(),
    then: Joi.date().iso().label('Email From').less(Joi.ref('emailUpto'))
  }),

  emailsUpto: Joi.date().iso().label('Email upto'),

  hasAttachments: Joi.boolean().label('HasAttachment'),
  page: Joi.number().label('Page number'),
  pageSize: Joi.number().label('Page size'),
  sortField: Joi.string().valid(
    emailOrderFields.ATTACTHMENT_COUNT,
    emailOrderFields.LAST_UPDATED_DATE_TIME
  ),
  sortDirection: Joi.string().valid(
    emailOrderDirections.ASC,
    emailOrderDirections.DESC
  ),
  hasClientResponses: Joi.boolean()
});

export { fetchEmailThreadsRequestQuerySchema };
