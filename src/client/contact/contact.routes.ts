import { Router } from 'express';

import { schema } from '../../core/middlewares/validate';
import * as contactController from './contact.controller';
import { logEvents } from '../eventLogs/eventLogs.controller';
import authenticate from '../../core/middlewares/authenticate';
import { updateValidator } from './validators/update.validator';
import authorizeEmailView from './middlewares/authorizeEmailView';
import authorizeContactView from './middlewares/authorizeContactView';
import { searchParamValidator } from './validators/searchParam.validator';
import { getContactDetailByUserId } from './middlewares/getContactDetailById';

const router: Router = Router();

router.post(
  '/',
  authenticate,
  logEvents,
  authorizeContactView,
  schema(searchParamValidator),
  contactController.fetchAll
);

router.get(
  '/download-csv',
  authenticate,
  logEvents,
  authorizeContactView,
  contactController.downloadCSV
);

router.get(
  '/:id',
  authenticate,
  authorizeContactView,
  contactController.fetchOne
);

router.put(
  '/:id',
  authenticate,
  authorizeContactView,
  schema(updateValidator),
  contactController.updateContactInformation
);

router.post(
  '/:id/emails',
  authenticate,
  getContactDetailByUserId,
  logEvents,
  authorizeEmailView,
  schema(searchParamValidator),
  contactController.fetchEmails
);

export default router;
