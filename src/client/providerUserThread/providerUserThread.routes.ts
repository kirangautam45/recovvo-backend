import { Router } from 'express';

import authenticate from '../../core/middlewares/authenticate';

import * as providerUserThread from './providerUserThread.controller';
import { logEvents } from '../../client/eventLogs/eventLogs.controller';
import { getContactDetailByProviderUserThreadId } from '../../client/contact/middlewares/getContactDetailById';

import { schema } from '../../core/middlewares/validate';
import authorizeEmailActivitiesView from './middlewares/authorizeEmailActivitiesView';
import { searchParamValidator } from '../../client/contact/validators/searchParam.validator';

const router: Router = Router();

router.post(
  '/emails/:id/activities',
  authenticate,
  getContactDetailByProviderUserThreadId,
  logEvents,
  authorizeEmailActivitiesView,
  schema(searchParamValidator),
  providerUserThread.fetchEmailActivities
);

export default router;
