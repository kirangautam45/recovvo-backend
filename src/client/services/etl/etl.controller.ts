import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import { startInitialFetch, findTaskStatus } from './etl';
import { getTenantSchemaName } from '../../../core/utils/recovoUtils';
import * as organizationOperationDao from '../../organizationOperation/organizationOperation.dao';

/**
 * Start the initial ETL fetch
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function startETLInitialFetch(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const organizationOperation = await organizationOperationDao.findFirstById(
      tenantName,
      res.locals.loggedInPayload.organizationOperationId
    );

    await startInitialFetch(tenantName, organizationOperation.slug);

    res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
}

/**
 * Find the status of the initial ETL task
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function findInitialETLTaskStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const organizationOperation = await organizationOperationDao.findFirstById(
      tenantName,
      res.locals.loggedInPayload.organizationOperationId
    );
    const initialFetchTaskId = organizationOperation.initialFetchTaskId;

    const response = await findTaskStatus(initialFetchTaskId);

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: response
    });
  } catch (err) {
    next(err);
  }
}
