import { Router } from 'express';

import authenticate from '../../core/middlewares/authenticate';
import * as gsuiteController from './pdf.controller';
import authorize from '../../core/middlewares/authorize';

const router: Router = Router();

router.get(
  '/download/manual/google-workspace-setup',
  authenticate,
  authorize,
  gsuiteController.downloadGoogleWorkspaceSetupManual
);

export default router;
