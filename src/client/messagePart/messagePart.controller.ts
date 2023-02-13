import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';

import * as messagePartService from './messagePart.service';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';

/**
 * Get pressigned url for attachment
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function getPressignedUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const data = await messagePartService.getPressignedUrl(
      res.locals.loggedInPayload,
      tenantName,
      Number(req.params.id)
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
 * Fetch all attachments with filter and page.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchAllAttachments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const visibleProviderUsers = res.locals.visibleProvidersInfos;

    const tenantName = getTenantSchemaName(req.baseUrl);

    let response = { data: [] };
    if (!res.locals.isClientDomainIdsEmpty) {
      response = await messagePartService.fetchAttachmentsWithFilterAndPage(
        res.locals.loggedInPayload.email,
        tenantName,
        visibleProviderUsers,
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
