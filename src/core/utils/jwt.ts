import jwbt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

import logger from './logger';
import config from '../config/config';
import JWTPayload from '../../client/auth/dto/jwtPayload.dto';
import { MICROSOFT_KEYS_URI } from '../../client/common/constants/uri';
import LoginUserPayload from '../../client/auth/dto/loginUserPayload.dto';

const {
  accessTokenDuration,
  accessTokenSecretKey,
  refreshTokenDuration,
  refreshTokenSecretKey,
  invitaitonEmailDuration,
  invitationEmailSecretKey,
  outlookClientId
} = config.auth;

/**
 * Generate access token from given data
 *
 * @param {LoggedInUser} data
 * @returns {string}
 */
export function generateAccessToken(data: LoginUserPayload): string {
  logger.log('info', 'JWT: Generating access token -', {
    data,
    expiresIn: accessTokenDuration
  });

  return jwbt.sign({ data }, accessTokenSecretKey, {
    expiresIn: accessTokenDuration
  });
}

/**
 * Generate refresh token from given data
 *
 * @param {JWTPayload} data
 * @returns {string}
 */
export function generateRefreshToken(data: JWTPayload): string {
  logger.log('info', 'JWT: Generating refresh token -', {
    data,
    expiresIn: refreshTokenDuration
  });

  return jwbt.sign({ data }, refreshTokenSecretKey, {
    expiresIn: refreshTokenDuration
  });
}

/**
 * Generate invitation token from given data
 *
 * @param {LoggedInUser} data
 * @returns {string}
 */
export function generateInvitationToken(data: any): string {
  logger.log('info', 'JWT: Generating invitation token -', {
    data,
    expiresIn: invitaitonEmailDuration
  });

  return jwbt.sign({ data }, invitationEmailSecretKey, {
    expiresIn: invitaitonEmailDuration
  });
}

/**
 * Verify invitation token.
 *
 * @param {string} token
 * @returns {any | string}
 */
export function verifyInvitationToken(token: string): any | string {
  return jwbt.verify(token, invitationEmailSecretKey);
}

/**
 * Verify access token.
 *
 * @param {string} token
 * @returns {any | string}
 */
export function verifyAccessToken(token: string): any | string {
  return jwbt.verify(token, accessTokenSecretKey);
}

/**
 * Verify refresh token.
 *
 * @param {string} token
 * @returns {any | string}
 */
export function verifyRefreshToken(token: string): any | string {
  return jwbt.verify(token, refreshTokenSecretKey);
}

function getOutlookKey(header: any, callback: any) {
  const client = jwksClient({
    jwksUri: MICROSOFT_KEYS_URI
  });

  client.getSigningKey(header.kid, function (error: any, key: any) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);

    throw error;
  });
}
/**
 * Verify id token provided by outlook.
 *
 * @param {string} token
 * @returns {any | string}
 */
export function verifyIdTokenOfOutlook(tokenId: string): any {
  return new Promise(function (resolve, reject) {
    jwbt.verify(
      tokenId,
      getOutlookKey,
      {
        algorithms: ['RS256'],
        audience: outlookClientId
      },
      function (err, data: any) {
        if (err) {
          reject(new Error('Outlook id is not valid'));
        }

        resolve(data);
      }
    );
  });
}
