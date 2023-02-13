import { Router } from 'express';

import { schema } from '../../core/middlewares/validate';
import { oAuthValidator } from './validators/oAuth.validator';

import * as authController from './oAuth.controller';

const router: Router = Router();

router.post('/google/login', schema(oAuthValidator), authController.login);
router.post(
  '/outlook/login',
  schema(oAuthValidator),
  authController.loginWithOutlook
);

export default router;
