import { Router } from 'express';
import * as etlController from './etl/etl.controller';
import authorize from '../../core/middlewares/authorize';
import authenticate from '../../core/middlewares/authenticate';

const router: Router = Router();

router.post(
  '/etl/start-initial-fetch',
  authenticate,
  authorize,
  etlController.startETLInitialFetch
);

router.get('/etl/initial-fetch-status', etlController.findInitialETLTaskStatus);

export default router;
