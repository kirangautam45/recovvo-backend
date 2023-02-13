import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';

import * as userDao from '../user.dao';
import lang from '../../../core/common/lang';
import logger from '../../../core/utils/logger';
import ForbiddenError from '../../../core/exceptions/ForbiddenError';
import { getTenantSchemaName } from '../../../core/utils/recovoUtils';
import * as userAliasDao from '../../userAliasMappings/userAlias.dao';
import * as providerUserThreadDao from '../../providerUserThread/providerUserThread.dao';

const { errors } = lang;

/**
 * Authorizes alias of the user to view emails.
 * Adds userInfo payload to the res.locals
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 *
 * @returns Promise
 */
async function authorizeAliasEmailView(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantSchemaName = getTenantSchemaName(req.baseUrl);
    const loggedInUser = res.locals.loggedInPayload;
    const { id } = req.params;
    logger.log(
      'info',
      `Verify Alias Acess of logged in user with id: - %s`,
      id
    );

    const aliasDetail = await userAliasDao.findOne(tenantSchemaName, {
      userId: loggedInUser.userId,
      aliasUserId: Number(id)
    });

    if (!aliasDetail) {
      throw new ForbiddenError(errors.unAuthorized);
    }

    const aliasEndDate = aliasDetail.aliasEndDate;
    const aliasStartDate = aliasDetail.aliasStartDate;

    const today = new Date();

    if (today < aliasStartDate || (aliasEndDate && today > aliasEndDate)) {
      throw new ForbiddenError(errors.unAuthorized);
    }

    const tenantName = getTenantSchemaName(req.baseUrl);
    const user = await userDao.findById(tenantName, Number(id));
    const aliasInfo = _.pick(user, 'id', 'firstName', 'lastName', 'email');
    res.locals.aliasInfo = aliasInfo;

    next();
  } catch (err) {
    next(err);
  }
}

export async function authorizeAliasEmailActivityView(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { baseUrl } = req;
  const userId = req.params.userId; // userId of alias
  const loggedInUserPayload = res.locals.loggedInPayload;
  const loggedInUserId = loggedInUserPayload.userId;
  const tenantSchemaName = getTenantSchemaName(baseUrl);
  const { id } = req.params; // thread Id

  try {
    const aliasDetail = await userAliasDao.findOne(tenantSchemaName, {
      userId: loggedInUserId,
      aliasUserId: Number(userId)
    });

    if (!aliasDetail) {
      throw new ForbiddenError(errors.unAuthorized);
    }

    const aliasEndDate = aliasDetail.aliasEndDate;
    const aliasStartDate = aliasDetail.aliasStartDate;

    const today = new Date();

    if (today < aliasStartDate || (aliasEndDate && today > aliasEndDate)) {
      throw new ForbiddenError(errors.unAuthorized);
    }
    logger.log(
      'info',
      `Verifying if the thread %s belongs to user with id - %s`,
      id,
      userId
    );

    const userThreads = await providerUserThreadDao.fetchThreadIdsByUserId(
      tenantSchemaName,
      Number(userId)
    );

    const userThreadIds = _.map(userThreads, 'id');

    if (!userThreadIds.includes(id)) {
      throw new ForbiddenError(errors.unAuthorized);
    }

    next();
  } catch (err) {
    next(err);
  }
}

export default authorizeAliasEmailView;
