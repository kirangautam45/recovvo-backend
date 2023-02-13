import { Router } from 'express';

import tenantRoutes from './tenants/tenant.routes';
import oAuthRoutes from './auth/oAuth.routes';

const router: Router = Router();

router.use('/clients', tenantRoutes);
router.use('/oauth', oAuthRoutes);

export default router;
