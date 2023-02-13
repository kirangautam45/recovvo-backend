import Multer from 'multer';
import { Router } from 'express';

import { schema } from '../../core/middlewares/validate';
import authorize from '../../core/middlewares/authorize';
import { csvValidators } from './validators/csv.validator';
import authenticate from '../../core/middlewares/authenticate';
import { validateCSV } from '../../core/middlewares/validateCSV';
import { userValidator } from '../user/validators/user.validator';
import * as suppressionListController from './suppressionList.controller';

const router: Router = Router();
const upload = Multer({ dest: 'tmp/csv/' });

router.get(
  '/status',
  authenticate,
  authorize,
  suppressionListController.getSuppressionStatus
);

router.post(
  '/upload',
  authenticate,
  authorize,
  upload.single('file'),
  validateCSV(csvValidators),
  suppressionListController.uploadCSV
);

router.post(
  '/validate',
  authenticate,
  authorize,
  schema(userValidator),
  suppressionListController.validateSuppressionUsers
);

router.post(
  '/users',
  authenticate,
  authorize,
  schema(userValidator),
  suppressionListController.uploadSuppressionUsers
);

router.get(
  '/suggest',
  authenticate,
  authorize,
  suppressionListController.fetchSuppressionListByQuery
);

router.get(
  '',
  authenticate,
  authorize,
  suppressionListController.fetchSuppressedUsersByQuery
);

router.post(
  '/users/remove',
  authenticate,
  authorize,
  suppressionListController.removeUserSuppressionList
);

router.post(
  '/users/:id/remove',
  authenticate,
  authorize,
  suppressionListController.removeUserSuppression
);

export default router;
