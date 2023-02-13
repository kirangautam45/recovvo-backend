import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';
import OnboardingStatuses from '../common/constants/oboardingSteps';
import * as organizationOperationService from './organizationOperation.service';

/**
 * Fetch the value of onBoardingStep
 *
 * @param _ object
 * @param res object
 * @param next function
 */
export async function fetchCurrentOnboardingStep(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const loggedInUser = res.locals.loggedInPayload;

    const response = await organizationOperationService.fetchCurrentOnboardingStep(
      tenantName,
      loggedInUser?.serviceType
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
 * Return onboarding statuses value
 *
 * @param _ object
 * @param res object
 * @param next function
 */
export async function getOnboardingStatuses(
  _: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: OnboardingStatuses
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update onboarding step
 * @param req object
 * @param res object
 * @param next function
 */
export async function updateOnboardingStep(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const organizationOperationId =
      res.locals.loggedInPayload.organizationOperationId;

    const data = await organizationOperationService.updateOnboardingStep(
      tenantName,
      req.body.currentStep,
      organizationOperationId
    );
    res.status(HttpStatus.OK).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function updateDefaultCollaboratorExpiry(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const organizationOperationId =
      res.locals.loggedInPayload.organizationOperationId;

    const data = await organizationOperationService.updateDefaultCollaboratorExpiry(
      tenantName,
      req.body,
      organizationOperationId
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update default collaborator expiry
 * @param req object
 * @param res object
 * @param next function
 */
export async function updateDefaultAliasExpiry(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const organizationOperationId =
      res.locals.loggedInPayload.organizationOperationId;

    const data = await organizationOperationService.updateDefaultAliasExpiry(
      tenantName,
      req.body,
      organizationOperationId
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * update email access time frame
 * @param req
 * @param res
 * @param next
 */
export async function updateEmailAccessTimeFrame(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const organizationOperationId =
      res.locals.loggedInPayload.organizationOperationId;

    const data = await organizationOperationService.updateEmailAccessTimeFrame(
      tenantName,
      req.body,
      organizationOperationId
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update return default collaborator access expiry information
 * @param req object
 * @param res object
 * @param next function
 */
export async function getDefaultCollaboratorExpiry(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const organizationOperationId =
      res.locals.loggedInPayload.organizationOperationId;

    const data = await organizationOperationService.getDefaultCollaboratorExpiry(
      tenantName,
      organizationOperationId
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update return default alias access expiry information
 * @param req object
 * @param res object
 * @param next function
 */
export async function getDefaultAliasExpiry(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const organizationOperationId =
      res.locals.loggedInPayload.organizationOperationId;

    const data = await organizationOperationService.getDefaultAliasExpiry(
      tenantName,
      organizationOperationId
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get the email access time frame
 * @param req object
 * @param res object
 * @param next function
 */
export async function getEmailAccessTimeFrame(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const data = await organizationOperationService.getEmailAccessTimeFrame(
      tenantName
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets the statuses of the account data settings.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function getAccountSettingStatuses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const organizationOperationId =
      res.locals.loggedInPayload.organizationOperationId;

    const data = await organizationOperationService.getAccountSettingStatuses(
      tenantName,
      organizationOperationId
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data
    });
  } catch (err) {
    next(err);
  }
}
