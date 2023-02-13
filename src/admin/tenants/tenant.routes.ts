import { Router } from 'express';

import * as tenantController from './tenant.controller';
import { schema } from '../../core/middlewares/validate';
import {
  createValidator,
  updateValidator
} from './validators/tenant.validator';
import authenticate from '../../core/middlewares/authenticate';

const router: Router = Router();

router.get('/', authenticate, tenantController.fetchAllTenants);
router.get('/:id', authenticate, tenantController.fetchTenant);
router.post(
  '/',
  authenticate,
  schema(createValidator),
  tenantController.createTenant
);
router.put(
  '/:id',
  authenticate,
  schema(updateValidator),
  tenantController.updateTenant
);

router.delete('/:id', authenticate, tenantController.deleteTenant);

router.post(
  '/:id/resend-invitation',
  authenticate,
  tenantController.resendInvitationToAdmin
);
export default router;
