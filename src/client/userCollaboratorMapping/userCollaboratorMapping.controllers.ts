import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';

import { DEFAULT_SIZE } from '../common/constants/recovoConstant';

import { getTenantSchemaName } from '../../core/utils/recovoUtils';

import * as userCollaboratorMappingService from './userCollaboratorMapping.services';
import { USER_COLLABORATOR_MAPPING_FILENAME } from '../../client/user/user.constants';

/**
 * Add collaborator mappings to user
 * @param req object
 * @param res object
 * @param next function
 * @returns Promise
 */
export async function addCollaborators(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await userCollaboratorMappingService.addCollaboratorMappings(
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
 * Validate the emails for assigning as collaborator
 * @param req object
 * @param res object
 * @param next function
 */
export async function validateCollaborator(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const data = await userCollaboratorMappingService.validateCollaborator(
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
 * Remove collaborator mapping to user
 * @param req object
 * @param res object
 * @param next function
 * @returns Promise
 */
export async function removeCollaborator(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    await userCollaboratorMappingService.removeCollaboratorMapping(
      tenantName,
      Number(req.params.id),
      req.body.collaboratorEmail
    );

    res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
}

/**
 * Remove collaborator mapping to user
 * @param req object
 * @param res object
 * @param next function
 * @returns Promise
 */
export async function removeAllCollaborators(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    await userCollaboratorMappingService.removeAllCollaboratorMappings(
      tenantName,
      Number(req.params.id)
    );

    res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch all active collaborators for user
 * @param req object
 * @param res object
 * @param next function
 * @returns Promise
 */
export async function fetchCollaborators(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const searchParam: any = req?.query?.searchParam;

    const response = await userCollaboratorMappingService.fetchCollaborators(
      tenantName,
      Number(req.params.id),
      searchParam
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: response?.map(
        ({ collaborationStartDate, collaborationEndDate, ...rest }) => {
          return {
            ...rest,
            accessStartDate: collaborationStartDate,
            accessEndDate: collaborationEndDate
          };
        }
      )
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update collaborators
 * @param req object
 * @param res object
 * @param next function
 * @returns Promise
 */
export async function updateCollaborators(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await userCollaboratorMappingService.update(
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

/***
 * Fetch all possible collaborators of the user
 * @param req object
 * @param res object
 * @param next function
 * @returns Promise
 */
export async function fetchPossibleCollaborators(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const searchQuery = req.query.search ? String(req.query.search) : '';
    const max = req.query.max ? Number(req.query.max) : DEFAULT_SIZE;

    const response = await userCollaboratorMappingService.fetchPossibleCollaborators(
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
 * Upload collaborator mappings using csv
 * @param req object
 * @param res object
 * @param next function
 * @returns Promise
 */
export async function uploadCollaboratorsMappingCsv(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const data = await userCollaboratorMappingService.uploadCollaboratorsMappingCsv(
      tenantName,
      Number(req.params.id),
      res.locals.csvResults
    );

    res.status(HttpStatus.OK).json({ code: HttpStatus.OK, data });
  } catch (err) {
    next(err);
  }
}

/**
 * Downloads CSV with users and mapped collaborators
 *
 * @param req object
 * @param res object
 * @param next function
 *
 */
export async function downloadUserCollaboratorCSV(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const userCollaboratorCSV = await userCollaboratorMappingService.downloadUserCollaboratorCSV(
      tenantName
    );
    res.setHeader(
      'Content-disposition',
      'attachment; filename=' + USER_COLLABORATOR_MAPPING_FILENAME
    );

    res.set('Content-Type', 'text/csv');
    res.status(HttpStatus.OK).send(userCollaboratorCSV);
  } catch (err) {
    next(err);
  }
}

/**
 * Upload collaborator mappings in bulk using csv.
 *
 * @param req object
 * @param res object
 * @param next function
 *
 * @returns Promise
 */
export async function uploadBulkUsersCollaboratorsMappingCsv(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const data = await userCollaboratorMappingService.uploadBulkUsersCollaboratorsMappingCsv(
      tenantName,
      res.locals.csvResults
    );

    res.status(HttpStatus.OK).json({ code: HttpStatus.OK, data });
  } catch (err) {
    next(err);
  }
}
