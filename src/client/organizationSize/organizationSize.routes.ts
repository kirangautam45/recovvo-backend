import { Router } from 'express';
import * as organizationSizeController from './organizationSize.controller';
import authenticate from '../../core/middlewares/authenticate';

const router: Router = Router();

/**
 * @swagger
 * /tenant/{tenantId}/organization-size-options:
 *  get:
 *    tags:
 *      [Onboarding]
 *    security:
 *       - BearerAuth: []
 *    description: Retrieve a list of organization size operations.
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    responses:
 *      200:
 *       description: A list of organization size operations.
 *       content:
 *        application/json:
 *         schema:
 *           properties:
 *            data:
 *             type: array
 *             items:
 *              $ref: '#/components/schemas/OrganizationSizeOperations'
 */
router.get(
  '/organization-size-options',
  authenticate,
  organizationSizeController.fetchOptions
);

export default router;
