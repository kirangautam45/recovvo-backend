import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';

import * as userAliasService from './userAlias.service';
import { DEFAULT_SIZE } from '../common/constants/recovoConstant';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';
import { USER_ALIAS_MAPPING_FILENAME } from '../user/user.constants';

/**
 * Validate the emails for assigning as alias
 * @param req object
 * @param res object
 * @param next function
 */
export async function validateAlias(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const data = await userAliasService.validateAlias(
      tenantName,
      Number(req.params.id),
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
 * Fetch possible list of alias for the user
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchPossibleAliases(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const searchQuery = String(req.query.search);
    const max = req.query.max ? Number(req.query.max) : DEFAULT_SIZE;
    const response = await userAliasService.findPossibleAlias(
      tenantName,
      Number(req.params.id),
      searchQuery,
      max
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
 * Add new alias mapping for the user
 * @param req object
 * @param res object
 * @param next function
 */
export async function addAliases(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const response = await userAliasService.addAliasMapping(
      tenantName,
      Number(req.params.id),
      req.body
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: response.data,
      meta: response.meta
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Remove alias mapping of the user
 * @param req object
 * @param res object
 * @param next function
 */
export async function removeAlias(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    await userAliasService.removeAliasMapping(
      tenantName,
      Number(req.params.id),
      req.body.aliasEmail
    );

    res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
}

/**
 * Remove all alias mapping of the user.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function removeBulkAlias(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const data = await userAliasService.removeBulkAliasMapping(
      tenantName,
      Number(req.params.id),
      req.body
    );

    res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function removeAllAlias(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    await userAliasService.removeAllAliases(tenantName, Number(req.params.id));

    res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch all active aliases for user
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchAliases(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const searchParam: any = req?.query?.searchParam;

    const response = await userAliasService.fetchAliases(
      tenantName,
      Number(req.params.id),
      searchParam
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
 * Update alias access dates to user
 * @param req object
 * @param res object
 * @param next function
 */

export async function updateAliasAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await userAliasService.updateAliasAccess(
      tenantName,
      Number(req.params.id),
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
 * Upload bulk alias mapping CSV.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function uploadBulkUsersAliasMappingCsv(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const response = await userAliasService.uploadBulkUsersAliasMappingCsv(
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
 * Upload alias mapping CSV.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function uploadAliasMappingCsv(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const response = await userAliasService.uploadAliasMappingCsv(
      tenantName,
      Number(req.params.id),
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

export async function downloadUserAliasCSV(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const userAliasCSV = await userAliasService.downloadUserAliasCSV(
      tenantName
    );

    res.setHeader(
      'Content-disposition',
      'attachment; filename=' + USER_ALIAS_MAPPING_FILENAME
    );
    res.set('Content-Type', 'text/csv');
    res.status(HttpStatus.OK).send(userAliasCSV);
  } catch (err) {
    next(err);
  }
}
