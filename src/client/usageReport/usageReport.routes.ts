import { Router } from 'express';

import authorize from '../../core/middlewares/authorize';
import { parseSort } from '../../core/middlewares/parseSort';
import authenticate from '../../core/middlewares/authenticate';
import * as usageReportController from './usageReport.controller';

const router: Router = Router();

router.get(
  '/download',
  authenticate,
  authorize,
  parseSort,
  usageReportController.downloadAll
);

/**
 * @swagger
 * /tenant/{tenantId}/usage-report:
 *  get:
 *    tags:
 *      [Admin]
 *    security:
 *       - BearerAuth: []
 *    description: 'Get Search Usage Statistics'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
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
 *            schema:
 *             type: 'object'
 *             properties:
 *              firstName:
 *               type: 'string'
 *              lastName:
 *               type: 'string'
 *              email:
 *               type: 'string'
 *              isAdmin:
 *               type: 'boolean'
 *              isSupervisor:
 *               type: 'boolean'
 *              department:
 *               type: 'string | null'
 *              searches:
 *               type: 'number'
 *              contactExports:
 *               type: 'string'
 *              attachmentExports:
 *               type: 'string'
 *              emailsReviewed:
 *               type: 'string'
 *              lastSearch:
 *               type: 'string'
 *            example:
 *             - firstName: 'liz'
 *               lastName: 'mon'
 *               email: 'lizmon@gmail'
 *               isAdmin: true
 *               isSupervisor: false
 *               department: null
 *               searches: '32'
 *               contactExports: '332'
 *               attachmentExports: '32'
 *               emailsReviewed: '121'
 *               lastSearch: 'techno'
 *             - firstName: 'luna'
 *               lastName: 'can'
 *               email: 'lunacan@gmail'
 *               isAdmin: false
 *               isSupervisor: true
 *               department: hr
 *               searches: '31'
 *               contactExports: '311'
 *               attachmentExports: '132'
 *               emailsReviewed: '11'
 *               lastSearch: 'cargio'
 *          total:
 *           type: number
 *           example: 3
 *          hasNextPage:
 *           type: boolean
 *           example: false
 *          page:
 *           type: number
 *           example: 1
 *          pageSize:
 *           type: number
 *           example: 10
 *          totalStats:
 *           type: 'array'
 *           items:
 *            schema:
 *             type: 'object'
 *             properties:
 *              searches:
 *               type: 'string'
 *              contactExports:
 *               type: 'string'
 *              attachmentExports:
 *               type: 'string'
 *              emailsReviewed:
 *               type: 'string'
 *            example:
 *             - searches: '23'
 *               contactExports: '231'
 *               attachmentExports: '32'
 *               emailsReviewed: '89'
 */
router.get(
  '/',
  authenticate,
  authorize,
  parseSort,
  usageReportController.fetchAll
);

export default router;
