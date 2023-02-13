import * as dotenv from 'dotenv';
import * as HTTPStatus from 'http-status-codes';
import * as googleAuth from 'google-auth-library';

import errorMessage from './oAuth.errors';
import * as userDao from '../user/user.dao';
import LoginPayload from './dto/loginPayload.dto';
import TokenResponse from './dto/tokenResponse.dto';
import roleMapper from '../user/mapper/role.mapper';
import * as providerDao from '../provider/provider.dao';
import * as tenantDao from '../../admin/tenants/tenant.dao';
import { ServiceType } from '../provider/enums/serviceType.enum';
import ForbiddenError from '../../core/exceptions/ForbiddenError';
import BadRequestError from '../../core/exceptions/BadRequestError';
import UnauthorizedError from '../../core/exceptions/UnauthorizedError';
import * as userSessionService from '../userSession/userSession.service';
import * as organizationOperationService from '../organizationOperation/organizationOperation.service';

import * as jwt from '../../core/utils/jwt';
import logger from '../../core/utils/logger';
import * as mixPanelService from '../../core/utils/mixpanel';
import { getUserDomainForSchema } from '../../core/utils/recovoUtils';

dotenv.config();
const OAuth2Client = new googleAuth.OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_SECRET
);

interface loginResponse {
  preferred_username: string;
  aud: string;
  ver: string;
  exp: string;
}

const authorizeUser = async (email: string, serviceType: string) => {
  const schema = getUserDomainForSchema(email); // TODO: Parse the email address to find the name of the schema

  const buff = Buffer.from(schema);
  const base64EncodedSchema = buff.toString('base64');

  const [tenant] = await tenantDao.fetchFromSlug(schema);

  if (!tenant) {
    throw new ForbiddenError(errorMessage.tenantNotFound);
  }

  if (!tenant.isActive) {
    throw new ForbiddenError(errorMessage.clientServiceInactive);
  }

  logger.log('info', 'Checking email: %s', email);

  const user = await userDao.findOne(schema, { email });
  logger.log('info', 'Current user', user || 'Not found.');

  if (!user || user?.isDeleted) {
    //user exists
    throw new BadRequestError(errorMessage.userNotFound);
  } else if (!user?.isAppUser) {
    // has been invited
    throw new BadRequestError(errorMessage.notInvited);
  } else if (!user?.isVerified) {
    // is verified
    throw new BadRequestError(errorMessage.notVerified);
  } else if (!user?.isActive) {
    // and is active
    throw new BadRequestError(errorMessage.notActive);
  }

  const onboardingStep: {
    onboardingStep: string;
    id: number;
  } = await organizationOperationService.fetchbyOrganizationId(
    schema,
    Number(user.organizationId)
  );

  const role = user.isAdmin
    ? roleMapper.ADMIN
    : user.isSupervisor
    ? roleMapper.SUPERVISOR
    : roleMapper.USER;

  if (user.isAdmin) {
    const providerFilters = {
      serviceType,
      organizationId: user?.organizationId
    };
    const iProvider = await providerDao.findOne(schema, providerFilters);

    if (!iProvider) {
      await providerDao.create(schema, {
        ...providerFilters,
        delegatedSubject: String(user?.email)
      });
    }
  }

  const updatedUser = await userDao.add(schema, Number(user.id), {
    lastLoginDate: new Date().toISOString(),
    hasSignedUp: true
  });

  const loggedInUser = {
    schema: base64EncodedSchema,
    name: user.name,
    email: email,
    userId: Number(updatedUser.id),
    organizationId: Number(user.organizationId),
    organizationOperationId: onboardingStep.id,
    role,
    serviceType
  };

  const refreshToken = jwt.generateRefreshToken(loggedInUser);
  const userSessionPayload = { userId: Number(user.id), token: refreshToken };
  const session = await userSessionService.create(schema, userSessionPayload);

  const accessToken = jwt.generateAccessToken({
    ...loggedInUser,
    sessionId: session.id
  });

  mixPanelService.setUser(email, user.firstName, user.lastName, role, schema);

  return {
    refreshToken,
    accessToken,
    onboardingStatus: onboardingStep,
    role,
    schema: base64EncodedSchema,
    serviceType
  };
};

/**
 * Login user session
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

    return authorizeUser(email, ServiceType.GSUITE);
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
 * Login with outlook user session
 *
 * @param loginPayload object
 * @returns Promise
 */
export async function loginWithOutlook(loginPayload: LoginPayload) {
  const { tokenId } = loginPayload;

  try {
    const decoded: loginResponse = await jwt.verifyIdTokenOfOutlook(tokenId);

    return authorizeUser(decoded?.preferred_username, ServiceType.OUTLOOK);
  } catch (error) {
    logger.log('debug', error);

    if (error.statusCode === HTTPStatus.BAD_REQUEST) {
      throw new BadRequestError(error.message);
    }

    if (error.statusCode === HTTPStatus.FORBIDDEN) {
      throw new ForbiddenError(error.message);
    }

    throw new UnauthorizedError(error.message);
  }
}
