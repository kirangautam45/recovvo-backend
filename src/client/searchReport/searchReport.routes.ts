import { Router } from 'express';

import authorize from '../../core/middlewares/authorize';
import { parseSort } from '../../core/middlewares/parseSort';
import authenticate from '../../core/middlewares/authenticate';
import * as searchReportController from './searchReport.controller';

const router: Router = Router();

/**
 * @swagger
 * /tenant/{tenantId}/search-report/download-csv:
 *  get:
 *    tags:
 *      [Admin]
 *    security:
 *       - BearerAuth: []
 *    description: 'Download search report csv file'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    responses:
 *     200:
 *      description: Search Report csv download successful.
 */
router.get(
  '/download-csv',
  authenticate,
  authorize,
  searchReportController.downloadSearchReportCSV
);

/**
 * @swagger
 * /tenant/{tenantId}/search-report:
 *  get:
 *    tags:
 *      [Admin]
 *    security:
 *       - BearerAuth: []
 *    description: 'Get Search Report'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'createdAtFrom'
 *         in: 'query'
 *         schema:
 *          type: Date
 *       - name: 'createdAtTo'
 *         in: 'query'
 *         schema:
 *          type: Date
 *       - name: 'page'
 *         in: 'query'
 *         schema:
 *          type: number
 *       - name: 'pageSize'
 *         in: 'query'
 *         schema:
 *          type: number
 *       - name: 'sort'
 *         in: 'query'
 *         schema:
 *          type: string
 *         description: 'Add - sign infront of param for desc'
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          code:
 *           type: 'number'
 *           example: 200
 *          data:
 *           type: 'array'
 *           items:
 *            type: 'object'
 *            properties:
 *             user:
 *              type: 'string'
 *             department:
 *              type: 'string'
 *             primarySearch:
 *              type: 'string'
 *             secondarySearch:
 *              type: 'string'
 *             searched:
 *              type: 'string'
 *             createdAt:
 *              type: 'string'
 *          total:
 *           type: number
 *          hasNextPage:
 *           type: boolean
 *          page:
 *           type: number
 *          pageSize:
 *           type: number
 *          totalStats:
 *           type: object
 */
router.get(
  '/',
  authenticate,
  authorize,
  parseSort,
  searchReportController.fetchSearchReport
);

export default router;
