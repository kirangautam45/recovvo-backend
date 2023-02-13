import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';

import { UsageReportQueryType } from './usageReport.service';
import * as usageReportService from './usageReport.service';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';

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
    const tenantName = getTenantSchemaName(req.baseUrl);

    const response = await usageReportService.fetchAllWithPage(tenantName, {
      ...req.query
    } as UsageReportQueryType);

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      ...response
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const {
      csv,
      createdAtSince,
      createdAtUntil
    } = await usageReportService.downloadAll(tenantName, {
      ...req.query
    } as UsageReportQueryType);

    const fileName =
      createdAtSince && createdAtUntil
        ? `usage_${createdAtSince}_${createdAtUntil}`
        : 'usage';

    res.setHeader('Content-disposition', 'attachment; filename=' + fileName);

    res.set('Content-Type', 'text/csv');
    res.status(HttpStatus.OK).send(csv);
  } catch (err) {
    next(err);
  }
}
