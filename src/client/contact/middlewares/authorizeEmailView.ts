import * as _ from 'lodash';
import { Request, Response, NextFunction } from 'express';

import errorMessage from '../contact.errors';
import * as contactService from '../contact.service';
import NotFoundError from '../../../core/exceptions/NotFoundError';
import ForbiddenError from '../../../core/exceptions/ForbiddenError';
import { getTenantSchemaName } from '../../../core/utils/recovoUtils';
import SearchAccessType from '../../common/enums/searchAccessType.enum';

/**
 * A middleware to authorize if the user is able to view the contact emails.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
async function authorizeEmailView(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!parseInt(req.params.id)) {
      throw new NotFoundError(errorMessage.ContactNotFound);
    }

    const tenantSchemaName = getTenantSchemaName(req.baseUrl);
    const contact = await contactService.findById(
      tenantSchemaName,
      Number(req.params.id)
    );
    const loggedInUser = res.locals.loggedInPayload;

    if (!contact) throw new NotFoundError(errorMessage.ContactNotFound);

    const clientDomainsInfo = await contactService.getClientDomainIdsByLoggedInUser(
      tenantSchemaName,
      loggedInUser,
      req.body
    );
    const clientDomainIds = clientDomainsInfo.allClientDomains;
    if (!clientDomainIds.includes(contact.clientDomainId)) {
      throw new ForbiddenError(errorMessage.UserNotAuthorized);
    }

    const currentContact = _.pick(contact, [
      'id',
      'firstName',
      'lastName',
      'email',
      'clientDomainId'
    ]);

    const contactFrom = getContactAccessType(clientDomainsInfo, currentContact);

    res.locals.contact = {
      ...currentContact,
      ...contactFrom
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Gets contact access and type.
 *
 * @param clientDomains
 * @param currentContact
 *
 * @returns
 */
export function getContactAccessType(
  clientDomains: any,
  currentContact: any
): { contactAccessType: SearchAccessType; contactFrom: number[] } {
  const aliasContactDomains = clientDomains.aliasClientDomainIds;
  const subordinateClientDomainIds = clientDomains.subordinateClientDomainIds;
  const domainMappingClientDomains = clientDomains.domainMappingClientDomains;

  let contactAccessType;

  if (domainMappingClientDomains.includes(currentContact.clientDomainId)) {
    contactAccessType = {
      contactAccessType: SearchAccessType.DOMAIN_MAPPING,
      contactFrom: clientDomains.mappedProviderUserIds
    };
  } else if (
    subordinateClientDomainIds.includes(currentContact.clientDomainId)
  ) {
    contactAccessType = {
      contactAccessType: SearchAccessType.SUPERVISOR_CONTINUOUS,
      contactFrom: clientDomains.subordinateIds
    };
  } else if (aliasContactDomains.includes(currentContact.clientDomainId)) {
    contactAccessType = {
      contactAccessType: SearchAccessType.ALIAS,
      contactFrom: clientDomains.aliasUserIds
    };
  } else {
    contactAccessType = {
      contactAccessType: SearchAccessType.N_A,
      contactFrom: []
    };
  }

  return contactAccessType;
}

export default authorizeEmailView;
