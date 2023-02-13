import * as dotenv from 'dotenv';

import app from '../../../package.json';

dotenv.config();

const isTestEnvironment = process.env.NODE_ENV === 'test';

export default {
  name: app.name,
  version: app.version,
  host: process.env.APP_HOST || '127.0.0.1',
  environment: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:8888',
  port:
    (isTestEnvironment ? process.env.TEST_APP_PORT : process.env.APP_PORT) ||
    '8000',
  pagination: {
    page: 1,
    maxRows: 20
  },
  auth: {
    saltRounds: process.env.SALT_ROUNDS || 11,
    accessTokenDuration: process.env.ACCESS_TOKEN_DURATION || '10m',
    refreshTokenDuration: process.env.REFRESH_TOKEN_DURATION || '24h',
    invitaitonEmailDuration: process.env.INVITATION_EMAIL_DURATION || '24h',
    emailVerificationDuration: process.env.EMAIL_VERIFICATION_DURATION || 24,
    accessTokenSecretKey:
      process.env.ACCESS_TOKEN_SECRET_KEY || '<ACCESS_TOKEN_SECRET_KEY>',
    refreshTokenSecretKey:
      process.env.REFRESH_TOKEN_SECRET_KEY || '<REFRESH_TOKEN_SECRET_KEY>',
    invitationEmailSecretKey:
      process.env.INVITATION_EMAIL_SECRET_KEY ||
      '<INVITATION_EMAIL_SECRET_KEY>',
    outlookClientId: process.env.OUTLOOK_CLIENT_ID
  },
  logging: {
    dir: process.env.LOGGING_DIR || 'logs',
    level: process.env.LOGGING_LEVEL || 'debug',
    maxSize: process.env.LOGGING_MAX_SIZE || '20m',
    maxFiles: process.env.LOGGING_MAX_FILES || '7d',
    datePattern: process.env.LOGGING_DATE_PATTERN || 'YYYY-MM-DD'
  },
  mail: {
    senderEmail: process.env.SENDER_EMAIL,
    redirectionUrl: process.env.REDIRECTION_URL,
    developerEmail: process.env.DEVELOPER_EMAIL,
    salesEmail: process.env.SALES_EMAIL
  },
  commonDb: {
    client: process.env.DB_CLIENT,
    connection: {
      charset: 'utf8',
      timezone: 'UTC',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT || '5432'),
      database:
        process.env.NODE_ENV === 'test'
          ? process.env.TEST_DB_COMMON_NAME
          : process.env.COMMON_DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      pool: { min: 2, max: 3 }
    }
  },
  tenantDb: {
    client: process.env.DB_CLIENT,
    connection: {
      charset: 'utf8',
      timezone: 'UTC',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT || '5432'),
      database:
        process.env.NODE_ENV === 'test'
          ? process.env.TEST_DB_TENANT_NAME
          : process.env.LOCAL_DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      pool: { min: 2, max: 3 }
    }
  },
  aws: {
    region: process.env.AWS_REGION
  },
  awsLocalConfig: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  secretManager: {
    region: process.env.SECRET_MANAGER_REGION,
    secretId: process.env.SECRET_MANAGER_SECRET_ID
  },
  s3: {
    region: process.env.AWS_S3_REGION,
    expiration: process.env.PRESIGNED_URL_EXPIRATION,
    bucketName: process.env.AWS_S3_BUCKET
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    secret: process.env.GOOGLE_SECRET
  },
  mixpanel: {
    token: process.env.MIXPANEL_TOKEN || ''
  }
};
