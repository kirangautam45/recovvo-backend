import * as HTTPStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';

import * as authService from './oAuth.service';

/**
 * Handles /google/login request.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await authService.login(req.body);

    res.status(HTTPStatus.OK).json({
      data,
      code: HTTPStatus.OK
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles /outlook/login request.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function loginWithOutlook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await authService.loginWithOutlook(req.body);

    res.status(HTTPStatus.OK).json({
      data,
      code: HTTPStatus.OK
    });
  } catch (error) {
    next(error);
  }
}
