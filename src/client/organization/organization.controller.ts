import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import * as organizationService from './organization.service';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';

/**
 * Update organization admin info with organization info
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function updateWithUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = res.locals.loggedInPayload.userId;
    const organizationId = res.locals.loggedInPayload.organizationId;
    const tenantName = getTenantSchemaName(req.baseUrl);
    const data = await organizationService.updateWithUser(
      tenantName,
      userId,
      organizationId,
      req.body
    );
    res.status(HttpStatus.OK).json(data);
  } catch (err) {
    next(err);
  }
}
