import { Router } from 'express';

import authorize from '../../core/middlewares/authorize';
import { schema } from '../../core/middlewares/validate';
import authenticate from '../../core/middlewares/authenticate';
import * as organizationController from './organization.controller';
import { organizationValidator } from './validators/organization.validator';

const router: Router = Router();

/**
 * @swagger
 * /tenant/{tenantId}/organization/update:
 *  post:
 *    tags:
 *      [Onboarding]
 *    security:
 *       - BearerAuth: []
 *    description: 'Update organization'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    requestBody:
 *     description: Json object containing organization updates
 *     content:
 *      application/json:
 *        schema:
 *         type: object
 *         properties:
 *          organizationUrl:
 *           type: string
 *          organizationName:
 *           type: string
 *          userPosition:
 *           type: string
 *          userDepartment:
 *           type: string
 *          organizationSize:
 *           type: string
 *          industry:
 *           type: string
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          data:
 *           type: object
 *           properties:
 *            users:
 *             type: array
 *             items:
 *              $ref: '#/components/schemas/User'
 *            organization:
 *             type: array
 *             items:
 *              $ref: '#/components/schemas/Organization'
 */
router.post(
  '/update',
  authenticate,
  authorize,
  schema(organizationValidator),
  organizationController.updateWithUser
);

export default router;
