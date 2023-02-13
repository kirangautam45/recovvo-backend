import { Request, Response, NextFunction } from 'express';

import * as jwt from '../utils/jwt';
import logger from '../utils/logger';
import lang from '../common/lang';
import ErrorType from '../common/enums/errorType.enum';
import UnauthorizedError from '../exceptions/UnauthorizedError';

const { errors } = lang;

const tokenErrorMessageMap: any = {
  [ErrorType.INVALID]: errors.invalidToken,
  [ErrorType.EXPIRED]: errors.accessTokenExpired
};

/**
 * A middleware to authenticate the authorization token i.e. access token.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.locals.accessToken = String(req.headers.authorization).replace(
      'Bearer ',
      ''
    );
    if (!req.headers.authorization || !res.locals.accessToken) {
      throw new UnauthorizedError(errors.noToken);
    }

    logger.log('info', 'JWT: Verifying token');
    const response: any = jwt.verifyAccessToken(res.locals.accessToken);

    res.locals.loggedInPayload = response.data;

    logger.log(
      'debug',
      'JWT: Authentication verified of email - %s',
      res.locals.loggedInPayload.email
    );

    next();
  } catch (err) {
    const tokenErrorMessage = tokenErrorMessageMap[err.name];
    logger.log('error', 'JWT: Authentication failed - %s', err.message);

    if (tokenErrorMessage) {
      logger.log('error', 'JWT: Token error - %s', tokenErrorMessage);

      next(new UnauthorizedError(tokenErrorMessage));
    } else {
      next(err);
    }
  }
}

export default authenticate;
