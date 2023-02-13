import * as HttpStatus from 'http-status-codes';
import * as providerService from './provider.service';
import { Request, Response, NextFunction } from 'express';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';

export interface CredentialUploadBadRequestType {
  code: string;
  status: string;
  message: string;
}

/**
 * Upload credentials into integration domain
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function uploadCredential(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await providerService.insert(
      tenantName,
      res.locals.loggedInPayload.userId,
      {
        serviceType: req.body.service_type,
        credentials: res.locals.credentials
      }
    );
    const badRequestResponse = <CredentialUploadBadRequestType>(
      (<unknown>response)
    );

    if (badRequestResponse.code) {
      res.status(HttpStatus.BAD_REQUEST).json({
        code: HttpStatus.BAD_REQUEST,
        status: badRequestResponse.status,
        message: badRequestResponse.message
      });
    } else {
      res.status(HttpStatus.OK).json({
        code: HttpStatus.OK,
        data: response
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Updates Tenant Information.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export async function updateTenantInformation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    await providerService.updateTenantInformation(
      tenantName,
      req.body.azureTenantId
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: 'success'
    });
  } catch (err) {
    next(err);
  }
}
