import papa from 'papaparse';
import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';

import * as contactService from './contact.service';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';
import { buildCSVStructure } from '../../core/utils/buildCSVStructure';
import { CONTACT_CSV_HEADERS, CONTACT_CSV_FILENAME } from './contact.constant';
import * as providerUserThread from '../providerUserThread/providerUserThread.service';

/**
 * Fetch list of contacts with filtered query.
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
    const visibleProvidersInfos = res.locals.visibleProvidersInfos;

    const tenantName = getTenantSchemaName(req.baseUrl);
    let response = { data: [] };
    if (!res.locals.isClientDomainIdsEmpty) {
      response = await contactService.fetchAllWithFilterAndPage(
        res.locals.loggedInPayload.email,
        tenantName,
        visibleProvidersInfos,
        {
          ...req.query,
          clientDomainIds: res.locals.clientDomainIds,
          clientContactIds: res.locals.clientContactIds
        }
      );
    }

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      ...response
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch contact from id
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchOne(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await contactService.findById(
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
 * Download list of contacts csv file.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function downloadCSV(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const visibleProvidersInfos = res.locals.visibleProvidersInfos;

    let response = [];
    if (!res.locals.isClientDomainIdsEmpty) {
      response = await contactService.fetchAll(
        res.locals.loggedInPayload.email,
        tenantName,
        visibleProvidersInfos,
        {
          ...req.query,
          clientDomainIds: res.locals.clientDomainIds,
          clientContactIds: res.locals.clientContactIds
        }
      );
    }

    const contactCSV = papa.unparse(
      buildCSVStructure(CONTACT_CSV_HEADERS, response)
    );

    res.setHeader(
      'Content-disposition',
      'attachment; filename=' + CONTACT_CSV_FILENAME
    );
    res.set('Content-Type', 'text/csv');
    res.status(HttpStatus.OK).send(contactCSV);
  } catch (err) {
    next(err);
  }
}

/**
 * Fetching list of provider user thread with filter
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchEmails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await providerUserThread.fetchByContactId(
      tenantName,
      res.locals.contact,
      res.locals.loggedInPayload,
      req.query
    );

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: {
        ...res.locals.contact,
        ...response
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update contact information
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function updateContactInformation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const response = await contactService.update(
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
