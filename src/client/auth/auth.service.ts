import errorMessage from './oAuth.errors';
import * as jwt from '../../core/utils/jwt';
import logger from '../../core/utils/logger';
import JWTPayload from './dto/jwtPayload.dto';
import * as bcrypt from '../../core/utils/bcrypt';
import LoginPayload from './dto/loginPayload.dto';
import roleMapper from '../user/mapper/role.mapper';
import TokenResponse from './dto/tokenResponse.dto';
import * as userService from '../user/user.service';
import * as tenantDao from '../../admin/tenants/tenant.dao';
import ForbiddenError from '../../core/exceptions/ForbiddenError';
import { getUserDomainForSchema } from '../../core/utils/recovoUtils';
import UnauthorizedError from '../../core/exceptions/UnauthorizedError';
import * as userSessionService from '../userSession/userSession.service';
import * as HTTPStatus from 'http-status-codes';
import BadRequestError from '../../core/exceptions/BadRequestError';
/**
 * Login user session
 *
 * @param loginPayload object
 * @returns Promise
 */
export async function login(
  loginPayload: LoginPayload
): Promise<TokenResponse> {
  const { email, password } = loginPayload;
  const schema = getUserDomainForSchema(email); // TODO: Parse the email address to find the name of the schema

  const buff = Buffer.from(schema);
  const base64EncodedSchema = buff.toString('base64');

  logger.log('info', 'Checking email: %s', email);
  const user = await userService.findByEmail(schema, email);

  if (user) {
    logger.log('debug', 'Login: Fetched user by email', user);
    logger.log('debug', 'Login Comparing Password');
    const isSame = await bcrypt.compare(password, user.password);

    logger.log('debug', 'Login: Password match status: - %s', isSame);

    if (isSame && user.id) {
      const loggedInUser = {
        name: user.firstName + user.lastName,
        email: email,
        userId: user.id,
        role: roleMapper.USER
      };
      const refreshToken = jwt.generateRefreshToken(loggedInUser);
      const userSessionPayload = { userId: user.id, token: refreshToken };
      const session = await userSessionService.create(
        schema,
        userSessionPayload
      );

      const accessToken = jwt.generateAccessToken({
        ...loggedInUser,
        sessionId: session.id
      });

      return { refreshToken, accessToken, schema: base64EncodedSchema };
    }
  }

  throw new UnauthorizedError('invalid credentials');
}

/**
 * Refresh user session
 *
 * @param token string
 * @param jwtPayload object
 * @returns Promise
 */
export async function refresh(
  token: string,
  jwtPayload: JWTPayload
): Promise<string> {
  try {
    const tenantSchemaName = getUserDomainForSchema(jwtPayload.email); // get the schema name from the token
    const session = await userSessionService.fetchByToken(
      tenantSchemaName,
      token
    );

    if (!session) {
      throw new ForbiddenError('session not valid');
    }
    const [tenant] = await tenantDao.fetchFromSlug(tenantSchemaName);

    logger.info('Fetched tenant with slug %s', tenant.slug);
    if (!tenant.isActive) {
      throw new ForbiddenError(errorMessage.clientServiceInactive);
    }

    logger.log('debug', 'User Session: Fetched session -', session);
    logger.log('info', 'JWT: Generating new access token');

    return jwt.generateAccessToken({
      ...jwtPayload,
      sessionId: session.id
    });
  } catch (err) {
    logger.log('debug', err);

    if (err.statusCode === HTTPStatus.BAD_REQUEST) {
      throw new BadRequestError(err.message);
    }

    if (err.statusCode === HTTPStatus.FORBIDDEN) {
      throw new ForbiddenError(err.message);
    }
    throw new UnauthorizedError(errorMessage.googleTokenIdInvalid);
  }
}

/**
 * Remove user session.
 *
 * @param {string} token
 */
export async function logout(
  token: string,
  jwtPayload: JWTPayload
): Promise<void> {
  logger.log('info', 'Logout: Logging out user session - %s', token);

  const tenantSchemaName = getUserDomainForSchema(jwtPayload.email); // TODO: get the schema name from the token
  const session = await userSessionService.remove(tenantSchemaName, token);

  if (!session) {
    throw new ForbiddenError('Session not maintained');
  }
}
