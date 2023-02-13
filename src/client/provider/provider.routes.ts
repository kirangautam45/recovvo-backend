import Multer from 'multer';
import { Router } from 'express';

import { schema } from '../../core/middlewares/validate';
import authorize from '../../core/middlewares/authorize';
import * as providerController from './provider.controller';
import authenticate from '../../core/middlewares/authenticate';
import {
  providerValidator,
  tenantValidator
} from './validators/provider.validator';
import { validateCredential } from '../../core/middlewares/validateCredential';

const router: Router = Router();
const upload = Multer({ dest: 'tmp/credentials/' });

router.post(
  '/upload-credentials',
  authenticate,
  authorize,
  upload.single('file'),
  schema(providerValidator),
  validateCredential(),
  providerController.uploadCredential
);

/**
 * @swagger
 * /tenant/{tenantId}/update-tenant:
 *  post:
 *    tags:
 *      [Onboarding]
 *    security:
 *       - BearerAuth: []
 *    description: 'Updates tenant information while onboarding outlook organization'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    requestBody:
 *      description: Json object containing azure AD tenant id
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              azureTenantId:
 *                type: string
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *     400:
 *      description: Bad request
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          message:
 *           type: string
 */
router.post(
  '/update-tenant',
  authenticate,
  authorize,
  schema(tenantValidator),
  providerController.updateTenantInformation
);

export default router;
