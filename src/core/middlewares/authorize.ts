import { Request, Response, NextFunction } from 'express';

import lang from '../common/lang';
import logger from '../utils/logger';
import ForbiddenError from '../exceptions/ForbiddenError';
import roleMapper from '../../client/user/mapper/role.mapper';

const { errors } = lang;

/**
 * A middleware to authorize the role of user.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
async function authorize(
  _: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const loggedInUser = res.locals.loggedInPayload;
    logger.log('info', 'Authorize: Verifying role');

    if (loggedInUser.role !== roleMapper.ADMIN) {
      throw new ForbiddenError(errors.userNotAuthorized);
    }
    next();
  } catch (err) {
    next(err);
  }
}

export default authorize;
