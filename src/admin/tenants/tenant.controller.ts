import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import * as tenantService from './tenant.service';

/**
 * Get all client Domains
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchAllTenants(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const response = await tenantService.fetchAllWithFilter({ ...req.query });

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: response
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all client Domains
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const response = await tenantService.fetchById(
      Number(req.params.id),
      res.locals.loggedInPayload.superAdminUserId
    );
    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: response
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create tenant
 * @param req object
 * @param res object
 * @param next function
 */
export async function createTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const response = await tenantService.insert(
      req.body,
      res.locals.loggedInPayload.superAdminUserId
    );
    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: response
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update tenant
 * @param req object
 * @param res object
 * @param next function
 */
export async function updateTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const response = await tenantService.update(
      Number(req.params.id),
      res.locals.loggedInPayload.superAdminUserId,
      req.body
    );
    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: response
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete tenant
 * @param req object
 * @param res object
 * @param next function
 */
export async function deleteTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const response = await tenantService.deleteTenant(Number(req.params.id));
    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: response
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Resend invitation link to user
 * @param req object
 * @param res object
 * @param next function
 */
export async function resendInvitationToAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await tenantService.resendInvitationToAdmin(Number(req.params.id));

    res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
}
