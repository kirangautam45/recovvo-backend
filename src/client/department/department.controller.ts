import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import * as departmentService from './department.service';
import { getTenantSchemaName } from './../../core/utils/recovoUtils';

/**
 * Fetch all department type options
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
    const response = await departmentService.fetchOptions(tenantSchema);

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: response
    });
  } catch (err) {
    next(err);
  }
}
