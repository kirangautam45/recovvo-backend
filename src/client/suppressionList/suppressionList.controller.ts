import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';

import { DEFAULT_SIZE } from '../common/constants/recovoConstant';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';
import * as suppressionListService from './suppressionList.service';

/**
 * Remove suppressed user.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function removeUserSuppression(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    await suppressionListService.removeUserSuppression(
      tenantName,
      Number(req.params.id)
    );

    res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
}

/**
 * Upload supresssion list using csv
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function uploadCSV(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await suppressionListService.processSuppressionCSV(
      tenantName,
      res.locals.csvResults
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
 * Upload suppression users.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function uploadSuppressionUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await suppressionListService.uploadSuppressionUsers(
      tenantName,
      req.body.emails
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
 * Fetch suppression list suggestions by query
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchSuppressionListByQuery(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const searchQuery = String(req.query.search);
    const max = req.query.max ? Number(req.query.max) : DEFAULT_SIZE;
    const data = await suppressionListService.fetchSuppressionListByQuery(
      tenantName,
      searchQuery,
      max
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
 * Validate suppresssion users
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function validateSuppressionUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const data = await suppressionListService.validateSuppressionUsers(
      tenantName,
      req.body.emails
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
 * Fetch suppression list suggestions by query
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchSuppressedUsersByQuery(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const searchQuery = String(req.query.search);
    const max = req.query.max ? Number(req.query.max) : DEFAULT_SIZE;
    const data = await suppressionListService.fetchSuppressedUsersByQuery(
      tenantName,
      searchQuery,
      max
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
 * Get Suppression status.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function getSuppressionStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const status = await suppressionListService.getSuppressionStatus(
      tenantName
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      status
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Remove user suppression list.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function removeUserSuppressionList(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    await suppressionListService.removeUserSuppressionList(tenantName);

    res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
}
