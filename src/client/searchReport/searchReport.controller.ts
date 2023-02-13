import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';

import * as searchReportService from './searchReport.service';
import { SEARCH_REPORT_FILENAME } from './searchReport.constants';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';

/**
 * Downloads search report.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function downloadSearchReportCSV(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);

    const searchReportCSV = await searchReportService.downloadSearchReportCSV(
      tenantName,
      req.query
    );

    res.setHeader(
      'Content-disposition',
      'attachment; filename=' + SEARCH_REPORT_FILENAME
    );
    res.set('Content-Type', 'text/csv');

    res.status(HttpStatus.OK).send(searchReportCSV);
  } catch (err) {
    next(err);
  }
}

/**
 * Gets search report.
 *
 * @param req object
 * @param res object
 * @param next function
 */
export async function fetchSearchReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantName = getTenantSchemaName(req.baseUrl);
    const response = await searchReportService.fetchSearchReport(
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
