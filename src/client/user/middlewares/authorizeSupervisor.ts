import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';

import * as userDao from '../user.dao';
import errorMessage from '../user.errors';
import lang from '../../../core/common/lang';
import logger from '../../../core/utils/logger';
import NotFoundError from '../../../core/exceptions/NotFoundError';
import ForbiddenError from '../../../core/exceptions/ForbiddenError';
import { getTenantSchemaName } from '../../../core/utils/recovoUtils';
import * as userSupervisorDao from '../../userMappings/userSupervisor.dao';
import * as providerUserThreadDao from '../../providerUserThread/providerUserThread.dao';

const { errors } = lang;

/**
 * Authorize supervisor of the user with userId to view email activities of a particular thread.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
async function authorizeSupervisor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { baseUrl } = req;
  const { userId } = req.params;
  const { id } = req.params;
  const loggedInUser = res.locals.loggedInPayload;
  const supervisorId = loggedInUser.userId;
  const tenantSchemaName = getTenantSchemaName(baseUrl);

  const user = await userDao.findById(tenantSchemaName, Number(userId));

  try {
    if (!parseInt(userId) || !user) {
      throw new NotFoundError(errorMessage.UserNotFound);
    }

    logger.log(
      'info',
      `Verify supervisor access of logged in user with id - %s`,
      userId
    );
    const userSupervisorMapping = await userSupervisorDao.find(
      tenantSchemaName,
      {
        userId
      }
    );
    const supervisorIds = _.map(userSupervisorMapping, 'supervisorId');

    if (!supervisorIds.includes(supervisorId)) {
      throw new ForbiddenError(errors.unAuthorized);
    }

    if (id) {
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
    }

    const subOrdinateInfo = _.pick(
      user,
      'id',
      'firstName',
      'lastName',
      'email'
    );
    res.locals.subOrdinateInfo = subOrdinateInfo;

    next();
  } catch (err) {
    next(err);
  }
}

export default authorizeSupervisor;
