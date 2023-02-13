import aws from 'aws-sdk';

import logger from '../../core/utils/logger';
import config from '../../core/config/config';

aws.config.update({ region: config.s3.region });

if (config.environment === 'development') {
  aws.config.update(config.awsLocalConfig);
}

const s3 = new aws.S3();

/**
 * Gets presigned url
 *
 * @param key string
 */
export async function getPresignedUrl(schema: string, key: string) {
  return new Promise((resolve, reject) => {
    logger.log('info', 'Geting presigned url -', {
      key
    });

    const bucketName = `${schema}-${config.s3.bucketName}`;
    const signedUrlExpireSeconds = Number(config.s3.expiration);
    s3.getSignedUrl(
      'getObject',
      {
        Bucket: bucketName,
        Key: key,
        Expires: signedUrlExpireSeconds
      },
      (err, url) => {
        if (err) {
          reject(err);
        }
        resolve(url);
      }
    );
  });
}
