import * as HttpStatus from 'http-status-codes';

import axios from 'axios';
import Provider from './provider.model';
import logger from '../../core/utils/logger';
import errorMessage from '../user/user.errors';
import * as userService from '../user/user.service';
import { addCredential } from './secretManager.service';
import ProviderPayload from './dto/providerPayload.dto';
import ServerError from '../../core/exceptions/ServerError';
import { UPLOAD_SUCCESS } from '../../core/utils/etlConstants';
import { ServiceType } from '../provider/enums/serviceType.enum';
import { responseFromETL } from '../../core/validators/credential';
import BadRequestError from '../../core/exceptions/BadRequestError';
import { constructEtlErrorMessage } from '../../core/utils/errorMessage';

/**
 * Insert into Provider
 *
 * @param {number} userId
 * @param {ProviderPayload} providerPayload
 * @returns {Promise<IProvider>}
 */
export async function insert(
  schema: string,
  userId: number,
  providerPayload: ProviderPayload
) {
  const user = await userService.findById(schema, userId);

  const etlMessage = await responseFromETL(
    String(user?.email),
    providerPayload.credentials
  );
  if (etlMessage !== UPLOAD_SUCCESS) {
    const errorMessage = constructEtlErrorMessage(etlMessage);
    logger.log('debug', 'Credential upload failed: ', etlMessage);
    return {
      code: HttpStatus.BAD_REQUEST,
      status: etlMessage.status,
      message: errorMessage
    };
  }

  logger.log('info', 'Updating credential into secret manager');
  const payload = {
    credential: JSON.stringify(providerPayload.credentials),
    delegatedSubject: String(user?.email)
  };

  return await addCredential(providerPayload.serviceType, payload, schema);
}

/**
 * Updates tenant information.
 *
 * @param {number} userId
 * @param {ProviderPayload} providerPayload
 * @returns {Promise<IProvider>}
 */
export async function updateTenantInformation(
  schema: string,
  tenantId: string
) {
  logger.log('info', 'Validating tenant id');
  const etlMessage = await validateTenantId(tenantId);
  if (etlMessage !== UPLOAD_SUCCESS) {
    logger.log(
      'debug',
      'Tenant Validation failed: %s',
      JSON.stringify(etlMessage)
    );
    throw new BadRequestError(etlMessage.message);
  }
  try {
    logger.log('info', 'Updating tenant id into secret manager');
    const payload = { tenant: tenantId };

    await addCredential(ServiceType.OUTLOOK, payload, schema);
    return await Provider.updateProviders(
      schema,
      {},
      { isTenantIdRecieved: true }
    );
  } catch {
    throw new ServerError(errorMessage.SomethingWentWrong);
  }
}

/**
 * Find one client domain user mapping by query
 *
 * @param query object
 */
export async function findOne(schema: string, query: any): Promise<any> {
  logger.log(
    'info',
    'Fetching one client domain user mapping by query from database',
    query
  );
  return await Provider.findOne(schema, query);
}

/**
 * Check if the azure id is valid or not
 *
 * @param tenantId string
 */
export async function validateTenantId(tenantId: string): Promise<any> {
  const url = `${process.env.ETL_ENDPOINT}/source/validate-tenant`;
  try {
    const data = {
      tenantId
    };
    await axios.post(url, data);
    return UPLOAD_SUCCESS;
  } catch (err) {
    return err.response.data;
  }
}
