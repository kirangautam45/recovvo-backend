import axios from 'axios';

import { UPLOAD_SUCCESS } from '../utils/etlConstants';

export const GOOGLE_CREDENTIAL_FIELDS = [
  'type',
  'project_id',
  'private_key_id',
  'private_key',
  'client_email',
  'client_id',
  'auth_uri',
  'token_uri',
  'auth_provider_x509_cert_url',
  'client_x509_cert_url'
];

/**
 * Check if the gmail credential is valid or not
 *
 * @param credentialFieldKeys array
 */
export function isGmailCredentialValid(credentials: any): boolean {
  const credentialFieldKeys = Object.keys(credentials);
  const isCredentialFieldsValid = GOOGLE_CREDENTIAL_FIELDS.every(
    (credentialField) => ~credentialFieldKeys.indexOf(credentialField)
  );

  return isCredentialFieldsValid && credentials.type === 'service_account';
}

/**
 * Check if the gmail credential has required scopes or not
 *
 * @param credentialFieldKeys array
 */
export async function responseFromETL(
  delegatedSubject: string,
  credentials: any
): Promise<any> {
  const url = `${process.env.ETL_ENDPOINT}/source/validate-credential`;
  try {
    const data = {
      delegatedSubject,
      credentials
    };
    await axios.post(url, data);
    return UPLOAD_SUCCESS;
  } catch (err) {
    return err.response.data;
  }
}
