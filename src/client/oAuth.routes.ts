import { Router } from 'express';

import authRoutes from './auth/auth.routes';
import googleOauthRoutes from './auth/oAuth.routes';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/oauth', googleOauthRoutes);

export default router;
