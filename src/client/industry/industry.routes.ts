import { Router } from 'express';
import * as industryController from './industry.controller';
import authenticate from '../../core/middlewares/authenticate';

const router: Router = Router();

/**
 * @swagger
 * /tenant/{tenantId}/industry-type-options:
 *  get:
 *    tags:
 *      [Onboarding]
 *    security:
 *       - BearerAuth: []
 *    description: 'Industry type options'
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
 *          data:
 *           type: array
 *           items:
 *            type: object
 *            properties:
 *             value:
 *              type: 'string'
 *             label:
 *              type: 'string'
 */
router.get(
  '/industry-type-options',
  authenticate,
  industryController.fetchOptions
);

export default router;
