import * as providerDao from '../../client/provider/provider.dao';
import * as secretManagerService from '../../client/provider/secretManager.service';

function convertCamelCaseToSnakeCase(jsonObject: any) {
  const camelCaseKeys = Object.keys(jsonObject);
  const snakeCaseKeys = camelCaseKeys.map((camelCaseKey: string) =>
    camelCaseKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  );

  const credential: any = {};
  for (let i = 0; i < camelCaseKeys.length; i++) {
    credential[snakeCaseKeys[i]] = jsonObject[camelCaseKeys[i]];
  }

  return credential;
}

/**
 * Function that moves credential to secret
 */
export async function moveCredentialToSecretManager(
  serviceType: string,
  schema: string
): Promise<void> {
  try {
    const provider = await providerDao.findOne(schema, { serviceType });
    if (!provider) {
      return;
    }
    const credential = convertCamelCaseToSnakeCase(provider.credentials);
    console.log('provider received', provider);
    await secretManagerService.addCredential(
      serviceType,
      credential,
      provider.delegatedSubject,
      schema
    );
    console.log('secret updated');
    process.exit(0);
  } catch (err) {
    console.log('error:', err);
    process.exit(1);
  }
}

const schema = process.argv[2];
const serviceType = process.argv[3];

if (!serviceType) {
  console.log('Email required');
  process.exit(1);
}

if (!schema) {
  console.log('Schema name required');
  process.exit(2);
}

moveCredentialToSecretManager(serviceType, schema);
