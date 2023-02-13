import * as jwt from '../../core/utils/jwt';
import logger from '../../core/utils/logger';
import * as HTTPStatus from 'http-status-codes';
import * as googleAuth from 'google-auth-library';

import errorMessage from './oAuth.errors';
import config from '../../core/config/config';
import RoleMapping from './mapper/role.mapper';
import LoginPayload from './interface/loginPayload.interface';
import TokenResponse from './interface/tokenResponse.interface';
import BadRequestError from '../../core/exceptions/BadRequestError';
import * as superAdminService from '../superAdmins/superAdmin.service';
import UnauthorizedError from '../../core/exceptions/UnauthorizedError';

const OAuth2Client = new googleAuth.OAuth2Client(
  config.google.clientId,
  config.google.secret
);

/**
 * Login superAdmin
 *
 * @param loginPayload object
 * @returns Promise
 */
export async function login(
  loginPayload: LoginPayload
): Promise<TokenResponse> {
  const { tokenId } = loginPayload;
  try {
    const ticket = await OAuth2Client.verifyIdToken({
      idToken: tokenId
    });

    const payload = ticket.getPayload();
    const email = String(payload?.email);

    logger.log('info', 'Checking email: %s', email);

    return authorizeSuperUser(email);
  } catch (err) {
    logger.log('debug', err);
    if (err.statusCode === HTTPStatus.BAD_REQUEST) {
      throw new BadRequestError(err.message);
    }
    throw new UnauthorizedError(errorMessage.googleTokenIdInvalid);
  }
}

/**
 * Login superAdmin
 *
 * @param loginPayload object
 * @returns Promise
 */
export async function loginWithOutlook(
  loginPayload: LoginPayload
): Promise<TokenResponse> {
  const { tokenId } = loginPayload;

  try {
    const decoded: any = await jwt.verifyIdTokenOfOutlook(tokenId);

    return authorizeSuperUser(decoded?.preferred_username);
  } catch (err) {
    logger.log('debug', err);
    if (err.statusCode === HTTPStatus.BAD_REQUEST) {
      throw new BadRequestError(err.message);
    }
    throw new UnauthorizedError(errorMessage.outlookTokenIdInvalid);
  }
}

/**
 * Authorize superAdmin
 *
 * @param email string
 * @returns Promise
 */
const authorizeSuperUser = async (email: string) => {
  const superAdmin = await superAdminService.fetchFromEmail(email);
  logger.log('info', 'Current super admin', superAdmin);

  if (!superAdmin) {
    throw new BadRequestError(errorMessage.superAdminNotFound);
  }

  const loggedInSuperAdmin = {
    name: superAdmin.firstName + superAdmin.lastName,
    email,
    role: RoleMapping.SUPERADMIN,
    superAdminUserId: superAdmin.id
  };

  const refreshToken = jwt.generateRefreshToken(loggedInSuperAdmin);

  const accessToken = jwt.generateAccessToken(loggedInSuperAdmin);

  return {
    refreshToken,
    accessToken,
    role: RoleMapping.SUPERADMIN
  };
};
