import { Router } from 'express';

import { schema } from '../../core/middlewares/validate';
import { logEvents } from '../eventLogs/eventLogs.controller';
import authenticate from '../../core/middlewares/authenticate';
import * as messagePartController from './messagePart.controller';
import authorizeContactView from '../contact/middlewares/authorizeContactView';
import { searchParamValidator } from '../contact/validators/searchParam.validator';

const router: Router = Router();

router.get(
  '/:id/presigned-url',
  authenticate,
  logEvents,

  messagePartController.getPressignedUrl
);

router.post(
  '/attachments',
  authenticate,
  logEvents,
  authorizeContactView,
  schema(searchParamValidator),
  messagePartController.fetchAllAttachments
);

export default router;
