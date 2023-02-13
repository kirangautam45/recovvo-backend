import { Request, Response, NextFunction } from 'express';

import errorMessage from '../providerUserThread.errors';
import * as contactService from '../../contact/contact.service';
import * as providerUserThread from '../providerUserThread.service';
import ForbiddenError from '../../../core/exceptions/ForbiddenError';
import { getTenantSchemaName } from '../../../core/utils/recovoUtils';

/**
 * A middleware to authorize if the user is able to view the contact email activities.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
async function authorizeEmailActivitiesView(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantSchemaName = getTenantSchemaName(req.baseUrl);
    const clientDomainIds = await providerUserThread.fetchClientDomainIdsById(
      tenantSchemaName,
      Number(req.params.id)
    );
    const loggedInUser = res.locals.loggedInPayload;

    if (clientDomainIds.length == 0) {
      throw new ForbiddenError(errorMessage.UserNotAuthorized);
    }

    const loggedInUserClientDomainIds = await contactService.getClientDomainIdsByLoggedInUser(
      tenantSchemaName,
      loggedInUser,
      req.body
    );
    const isClientDomainValid = loggedInUserClientDomainIds.allClientDomains.some(
      (clientDomainId: number) => ~clientDomainIds.indexOf(clientDomainId)
    );

    if (!isClientDomainValid) {
      throw new ForbiddenError(errorMessage.UserNotAuthorized);
    }

    next();
  } catch (err) {
    next(err);
  }
}

export default authorizeEmailActivitiesView;
