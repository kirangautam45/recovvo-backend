import aws from 'aws-sdk';

import logger from '../../core/utils/logger';
import config from '../../core/config/config';

if (config.environment === 'development') {
  aws.config.update(config.awsLocalConfig);
}

const client = new aws.SecretsManager({ region: config.secretManager.region });
const secretId = String(config.secretManager.secretId);

export async function addCredential(
  credentialType: string,
  secretPayload: { [key: string]: string },
  tenant: string
) {
  const data = await client.getSecretValue({ SecretId: secretId }).promise();
  const secrets = JSON.parse(String(data.SecretString));

  secrets[`${credentialType}-${tenant}`] = JSON.stringify(secretPayload);
  logger.log('info', 'Get credential from secret manager');

  return client
    .putSecretValue({
      SecretId: secretId,
      SecretString: JSON.stringify(secrets)
    })
    .promise();
}
