import * as HTTPStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';

import JWTPayload from './dto/jwtPayload.dto';
import * as authService from './auth.service';
import * as userService from '../user/user.service';
import UserPayload from '../user/dto/userPayload.dto';
import { getTenantSchemaName } from '../../core/utils/recovoUtils';

/**
 * Handle /login request.
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
 * Handle /refresh request.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function refresh(
  _: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = String(res.locals.refreshToken);
    const jwtPayload = res.locals.jwtPayload as JWTPayload;
    const data = await authService.refresh(token, jwtPayload);

    res.status(HTTPStatus.OK).json({
      data,
      code: HTTPStatus.OK
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle /logout request.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function logout(
  _: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = String(res.locals.refreshToken);
    const jwtPayload = res.locals.jwtPayload;
    await authService.logout(token, jwtPayload);

    res.status(HTTPStatus.OK).json({
      code: HTTPStatus.OK
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle /users POST request.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function signUp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = req.body as UserPayload;
    const tenantName = getTenantSchemaName(req.baseUrl);
    const response = await userService.insert(tenantName, userPayload);

    res.status(HTTPStatus.OK).json({
      code: HTTPStatus.OK,
      data: response
    });
  } catch (err) {
    next(err);
  }
}
