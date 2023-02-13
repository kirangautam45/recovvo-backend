import errorMessage from './user.errors';
import * as userService from './user.service';
import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import { constructUserFilter } from '../../core/utils/filter';
import { DEFAULT_SIZE } from '../common/constants/recovoConstant';
import {
  defaultPageSize,
  orderConfig
} from '../common/constants/userListConstants';
import NotFoundError from '../../core/exceptions/NotFoundError';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';
import {
  USER_SUPERVISOR_MAPPING_FILENAME,
  USER_CLIENT_DOMAIN_MAPPING_FILENAME
} from './user.constants';
import * as clientDomainService from '../clientDomain/clientDomain.service';
import * as clientDomainUserService from '../clientDomain/clientDomainUserMapping.service';

/**
 * Fetch all user
 *
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
    const pageParams = {
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || defaultPageSize
    };
    const sortParams =
      req.query.sortField != undefined && req.query.sortDirection != undefined
        ? orderConfig(
            String(req.query.sortField),
            String(req.query.sortDirection)
          )
        : orderConfig();

    const filter = constructUserFilter(req.query);
    const search = String(req.query.search) || '';
    const response = await userService.fetchAll(
      tenantName,
      res.locals.loggedInPayload,
      search,
      pageParams,
      sortParams,
      filter
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
 * Fetch user suggestion to be added manually
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchUserSuggestionByQuery(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const searchQuery = String(req.query.search);
    const max = req.query.max ? Number(req.query.max) : DEFAULT_SIZE;
    const data = await userService.fetchUserSuggestionByQuery(
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
 * Fetch user detail from Id
 * @param req object
 * @param res object
 * @param next function
 */
export async function findAppUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!parseInt(req.params.id)) {
      throw new NotFoundError(errorMessage.UserNotFound);
    }
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await userService.findAppUserById(
      tenantName,
      res.locals.loggedInPayload,
      Number(req.params.id)
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
 * Fetch user detail from Id
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchUserProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await userService.fetchUserProfile(
      tenantName,
      res.locals.loggedInPayload
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
 * Download user CSV template
 *
 * @param _ object
 * @param res object
 * @param next function
 */
export async function downloadTemplate(
  _: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.download('src/client/common/templates/users.template.csv');
  } catch (err) {
    next(err);
  }
}

/**
 * Validate Provider users
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function validateUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const data = await userService.validateUsers(tenantName, req.body.emails);

    res.status(HttpStatus.OK).json({ data });
  } catch (err) {
    next(err);
  }
}

/**
 * Manual-upload users
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function upload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const data = await userService.activateUsers(
      tenantName,
      res.locals.loggedInPayload.userId,
      req.body.emails
    );
    res.status(HttpStatus.OK).json({ data });
  } catch (err) {
    next(err);
  }
}

/**
 * Upload users using csv
 *
 * @param _ object
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
    const data = await userService.processCSV(
      tenantName,
      res.locals.loggedInPayload.userId,
      res.locals.csvResults
    );
    res.status(HttpStatus.OK).json({ data });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify email invitation
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function verifyEmailInvitation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const data = await userService.verifyEmailInvitation(
      tenantName,
      req.headers
    );
    res.status(HttpStatus.OK).json({ data });
  } catch (err) {
    next(err);
  }
}

/**
 * Update user information
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function updateUserInformation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const data = await userService.update(
      tenantName,
      Number(req.params.id),
      req.body
    );

    res.status(HttpStatus.OK).send({ data });
  } catch (err) {
    next(err);
  }
}

/**
 * Manual upload ClientDomainsUsers.
 *
 * Fetch all active supervisors
 * @param req object
 * @param res object
 * @param next function
 */
export async function manualUploadUserClientDomains(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await userService.mapDomains(
      tenantName,
      Number(req.params.id),
      req.body.domainUrls
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
 * Delete client-domain-user Mapping.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function removeClientDomainUserMapping(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    await userService.unmapDomain(
      tenantName,
      Number(req.params.id),
      req.body.domainId
    );

    res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch all mapped domains for a user.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchMappedDomains(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await userService.fetchUserClientDomains(
      tenantName,
      Number(req.params.id),
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
 * Validate Supervisors
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function validateSupervisor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const data = await userService.validateSupervisor(
      tenantName,
      Number(req.params.id),
      req.body.emails
    );

    res.status(HttpStatus.OK).json({ data });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch all active supervisors
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchPossibleSupervisors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const searchQuery = String(req.query.search);
    const max = req.query.max ? Number(req.query.max) : DEFAULT_SIZE;
    const response = await userService.findPossibleSupervisor(
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
 * Fetch all active supervisors
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchRecommendedSupervisors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const searchQuery = String(req.query.search);
    const max = req.query.max ? Number(req.query.max) : DEFAULT_SIZE;
    const response = await userService.fetchRecommendedSupervisors(
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
 * Add supervisor mapping to user
 * @param req object
 * @param res object
 * @param next function
 */
export async function addSupervisors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await userService.addSupervisorMapping(
      tenantName,
      Number(req.params.id),
      req.body.supervisorEmails
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
 * Remove supervisor mapping to user
 * @param req object
 * @param res object
 * @param next function
 */
export async function removeSupervisor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    await userService.removeSupervisorMapping(
      tenantName,
      Number(req.params.id),
      req.body.supervisorEmail
    );

    res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch all active supervisors for user
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchSupervisors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await userService.fetchSupervisors(
      tenantName,
      Number(req.params.id)
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
 * Resend invitation link to user
 * @param req object
 * @param res object
 * @param next function
 */
export async function resendInvitationToUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    await userService.resendInvitationToUser(tenantName, Number(req.params.id));

    res.sendStatus(HttpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
}

/**
 * Downloads CSV with users and mapped supervisors
 *
 * @param req object
 * @param res object
 * @param next function
 *
 */
export async function downloadUserSupervisorCSV(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const userSupervisorCSV = await userService.downloadUserSupervisorCSV(
      tenantName
    );
    res.setHeader(
      'Content-disposition',
      'attachment; filename=' + USER_SUPERVISOR_MAPPING_FILENAME
    );

    res.set('Content-Type', 'text/csv');
    res.status(HttpStatus.OK).send(userSupervisorCSV);
  } catch (err) {
    next(err);
  }
}

/**
 * Upload client domain mapping for specific user
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function uploadSpecificClientDomainUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await clientDomainService.processSpecificClientDomainsUsers(
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

/**
 * Downloads CSV with users and mapped client domains
 *
 * @param req object
 * @param res object
 * @param next function
 *
 */
export async function downloadUserClientDomainCSV(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const userClientDomainCSV = await clientDomainUserService.downloadClientDomainUsers(
      tenantName
    );

    res.setHeader(
      'Content-disposition',
      'attachment; filename=' + USER_CLIENT_DOMAIN_MAPPING_FILENAME
    );

    res.set('Content-Type', 'text/csv');
    res.status(HttpStatus.OK).send(userClientDomainCSV);
  } catch (err) {
    next(err);
  }
}

/**
 * Gets the possible search parameter list.
 *
 * @param req object
 * @param res object
 * @param next function
 *
 */
export async function getPersonalContactSearchParams(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const searchQuery = String(req.query.search) || '';
    const response = await userService.getPersonalContactSearchParams(
      tenantName,
      Number(res.locals.loggedInPayload.userId),
      searchQuery
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: response
    });
  } catch (err) {
    next(err);
  }
}
