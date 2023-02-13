import { Router } from 'express';
import admninRoutes from './admin/admin.routes';
import oAuthRoutes from './client/oAuth.routes';
import clientRoutes from './client/client.routes';
import * as homeController from './core/common/home/home.controller';

const router: Router = Router();

router.use('/admin', admninRoutes);
router.use('/tenant/:tenantName', clientRoutes);
router.use('/', oAuthRoutes);
router.get('/', homeController.index);

export default router;
