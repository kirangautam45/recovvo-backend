import { Router } from 'express';
import authenticate from '../../core/middlewares/authenticate';
import * as departmentController from './department.controller';

const router: Router = Router();

/**
 * @swagger
 * /tenant/{tenantId}/department-options:
 *  get:
 *    tags:
 *      [Onboarding]
 *    security:
 *       - BearerAuth: []
 *    description: 'Department options'
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
  '/department-options',
  authenticate,
  departmentController.fetchOptions
);

export default router;
