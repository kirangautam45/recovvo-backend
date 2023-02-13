import { Router } from 'express';

import * as authController from './auth.controller';
import validateRefreshToken from '../../core/middlewares/validateRefreshToken';

const router: Router = Router();

router.post('/login', authController.login);
router.post('/sign-up', authController.signUp);
router.post('/refresh', validateRefreshToken, authController.refresh);
router.post('/logout', validateRefreshToken, authController.logout);

export default router;
