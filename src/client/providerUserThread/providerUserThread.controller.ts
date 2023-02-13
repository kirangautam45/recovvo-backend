import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';

import * as providerUserThread from './providerUserThread.service';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';

/**
 * Fetch list of email activities with filtered query.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchEmailActivities(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const response = await providerUserThread.fetchByThreadId(
      tenantName,
      Number(req.params.id),
      res.locals.loggedInPayload.email
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
 * Fetches list of provider user thread with filter of a particular user.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchUserEmails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const response = await providerUserThread.fetchByUserId(
      tenantName,
      res.locals,
      req.query
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: {
        ...res.locals.subOrdinateInfo,
        ...response
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetches list of provider user thread with filter of a particular user.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchAliasEmails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const response = await providerUserThread.fetchByAliasId(
      tenantName,
      res.locals,
      req.query
    );
    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: {
        ...res.locals.aliasInfo,
        ...response
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetches provider user threads count.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchEmailsCount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { userId } = req.params;
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const response = await providerUserThread.fetchEmailsCount(
      tenantName,
      Number(userId)
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      emailsCount: response.count
    });
  } catch (err) {
    next(err);
  }
}
