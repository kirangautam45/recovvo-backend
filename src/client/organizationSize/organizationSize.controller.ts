import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import { getTenantSchemaName } from './../../core/utils/recovoUtils';
import * as organizationSizeService from './organizationSize.service';

/**
 * Fetch all Organization Sizes
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchOptions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantSchema = getTenantSchemaName(req.baseUrl);
    const response = await organizationSizeService.fetchOptions(tenantSchema);

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: response
    });
  } catch (err) {
    next(err);
  }
}
