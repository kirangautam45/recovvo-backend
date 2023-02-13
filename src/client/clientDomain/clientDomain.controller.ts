import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import * as clientDomainService from './clientDomain.service';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';
import { CLIENT_DOMAIN_MAPPING_FILENAME } from './clientDomain.constants';

/**
 * Upload clientDomain using CSV
 * @param _ object
 * @param res object
 * @param next function
 */
export async function uploadDomainCSV(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const response = await clientDomainService.processCSV(
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
 * Update company admin info with company info
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function uploadClientDomainsUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await clientDomainService.processClientDomainsUsers(
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
 * Validate client domains to be uplaoded manually
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function validateClientDomains(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const data = await clientDomainService.validateClientDomains(
      tenantName,
      req.body.domainUrls
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
 * Get all client Domains
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await clientDomainService.fetchAll(tenantName);
    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: response
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all client Domains based on filter
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchClientDomains(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await clientDomainService.fetchClientDomains(
      tenantName,
      req.query
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
 * Downloads CSV with client domains
 *
 * @param req object
 * @param res object
 * @param next function
 *
 */
export async function downloadClientDomainCSV(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const clientDomainCSV = await clientDomainService.downloadClientDomains(
      tenantName
    );
    res.setHeader(
      'Content-disposition',
      'attachment; filename=' + CLIENT_DOMAIN_MAPPING_FILENAME
    );

    res.set('Content-Type', 'text/csv');
    res.status(HttpStatus.OK).send(clientDomainCSV);
  } catch (err) {
    next(err);
  }
}

/**
 * Remove client domain
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function removeClientDomain(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    await clientDomainService.removeClientDomain(
      tenantName,
      Number(req.params.id)
    );

    res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
}
