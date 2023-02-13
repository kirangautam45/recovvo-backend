import * as _ from 'lodash';
import * as HttpStatus from 'http-status-codes';

import * as userDao from '../user/user.dao';
import logger from '../../core/utils/logger';
import message from './clientDomain.messages';
import errorMessage from './clientDomain.errors';
import * as clientDomainDao from './clientDomain.dao';
import { convertJsonToCSV } from '../../core/utils/csv';
import { validateDomain } from './validators/domain.validator';
import { getDomainFromEmail } from '../../core/utils/recovoUtils';
import BadRequestError from '../../core/exceptions/BadRequestError';
import { clientDomainCsvValidators } from './validators/csv.validator';
import * as clientDomainUserMappingDao from './clientDomainUserMapping.dao';
import { PROVIDER_DOMAIN_LIST } from '../common/constants/exclusionList';
import { clientDomainUserHeaders } from './validators/clientDomainUserMapping.validator';
import {
  buildCSVUserUploadResponse,
  buildClientDomainResponse
} from '../../core/utils/buildJSONResponse';
import {
  constructUserNotFound,
  constructClientDomainNotValid,
  constructClientDomainUnprocessable
} from '../../core/utils/errorMessage';

/**
 * Fetch all client Domains
 */
export async function fetchAll(schema: string) {
  return await clientDomainDao.fetchAll(schema);
}

/**
 * Fetch all client Domains
 * @param filter any
 */
export async function fetchClientDomains(schema: string, filter: any) {
  if (filter) {
    return await clientDomainDao.filterDomains(schema, filter);
  }

  return await clientDomainDao.find(schema, { isDeleted: false });
}

/**
 * Process the uploaded csv with domain users
 */
export async function processCSV(schema: string, results: any[]) {
  const allClientDomain = await clientDomainDao.fetchAll(schema);
  const clientDomains = allClientDomain.map((val) => ({
    domainName: val.domain,
    id: val.id
  }));

  const csvDomains = results.map((val) => val.Domains);
  const uniqueDomains = [...new Set(csvDomains)];

  const missingDomains = clientDomains.filter(function (v) {
    return !uniqueDomains.includes(v.domainName);
  });

  const admins = await userDao.find(schema, {
    isAdmin: true,
    isDeleted: false
  });

  const adminDomains = admins?.map((user) => getDomainFromEmail(user.email));

  const activeDomains = await Promise.all(
    uniqueDomains.map(async (domain) => {
      try {
        const isValidDomain = validateDomain(domain);

        if (!isValidDomain) {
          return buildClientDomainResponse(
            domain,
            HttpStatus.UNPROCESSABLE_ENTITY,
            errorMessage.DomainNotValid
          );
        }

        if (
          adminDomains?.includes(domain) ||
          PROVIDER_DOMAIN_LIST.includes(domain)
        ) {
          return buildClientDomainResponse(
            domain,
            HttpStatus.UNPROCESSABLE_ENTITY,
            errorMessage.UnprocessableDomain
          );
        }

        const clientDomain = await createIfNotExistClientDomain(schema, domain);
        return buildClientDomainResponse(
          clientDomain.domain,
          HttpStatus.OK,
          message.SuccessfullyAdded
        );
      } catch (err) {
        logger.log('debug', err);
        return buildClientDomainResponse(
          domain,
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage.SomethingWentWrong
        );
      }
    })
  );

  await Promise.all(
    missingDomains.map(async (domain) => {
      try {
        await removeClientDomain(schema, domain.id);
        return buildClientDomainResponse(
          domain.domainName,
          HttpStatus.OK,
          message.SuccessfullyDeactivated
        );
      } catch (err) {
        logger.log('debug', err);
        return buildClientDomainResponse(
          domain.domainName,
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage.SomethingWentWrong
        );
      }
    })
  );
  return activeDomains;
}

/**
 * A function that checks id the client domain exists and isDeleted then sets isDeleted true
 * @param results object[]
 */
export async function deactivateClientDomain(schema: string, domain: string) {
  logger.info('info', 'Deactivating domain', domain);
  const clientDomain = await clientDomainDao.findOne(schema, {
    domain: domain
  });
  if (clientDomain && !clientDomain.isDeleted) {
    await clientDomainDao.update(
      schema,
      { domain: domain },
      { isDeleted: true }
    );
    return clientDomain;
  } else {
    return clientDomain;
  }
}

/**
 * Processes uploaded client domain to user mapping
 *
 * @param results object[]
 */
export async function processClientDomainsUsers(
  schema: string,
  results: any[]
) {
  await clientDomainUserMappingDao.update(schema, {}, { isDeleted: true });

  const response = await Promise.all(
    results.map(async (result, index) => {
      try {
        return await uploadClientDomainsUsers(schema, index + 2, result);
      } catch (err) {
        logger.log('debug', err);
        return buildCSVUserUploadResponse(
          index + 2,
          result[clientDomainUserHeaders.emailAddress],
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage.SomethingWentWrong
        );
      }
    })
  );
  return response;
}

/**
 * Validates client domains to be uploaded
 *
 * @param clientDomainUrls string[]
 */
export async function validateClientDomains(
  schema: string,
  clientDomainUrls: string[]
) {
  return await Promise.all(
    clientDomainUrls.map(async (domain) => {
      const isValidDomain = validateDomain(domain);
      if (!isValidDomain) {
        return buildClientDomainResponse(
          domain,
          HttpStatus.BAD_REQUEST,
          errorMessage.DomainNotValid
        );
      }

      const admins = await userDao.find(schema, {
        isAdmin: true,
        isDeleted: false
      });
      const adminDomains = admins?.map((user) =>
        getDomainFromEmail(user.email)
      );

      if (
        adminDomains?.includes(domain) ||
        PROVIDER_DOMAIN_LIST.includes(domain)
      ) {
        return buildClientDomainResponse(
          domain,
          HttpStatus.BAD_REQUEST,
          errorMessage.UnprocessableDomain
        );
      }

      return buildClientDomainResponse(domain, HttpStatus.OK, 'success');
    })
  );
}

/**
 * Uploads client domain user mapping
 *
 * @param index number
 * @param result object
 */
async function uploadClientDomainsUsers(
  schema: string,
  index: number,
  result: any
) {
  const emailAddress: string = result[
    clientDomainUserHeaders.emailAddress
  ].toLowerCase();
  const domainUrl: string = result[clientDomainUserHeaders.domainUrl];

  const emptyError = areFieldsEmpty(emailAddress, domainUrl);

  if (emptyError) {
    return buildCSVUserUploadResponse(
      index,
      emailAddress,
      HttpStatus.BAD_REQUEST,
      emptyError
    );
  }

  const user = await userDao.findOne(schema, {
    email: emailAddress,
    isAppUser: true,
    isDeleted: false
  });
  if (!user) {
    return buildCSVUserUploadResponse(
      index,
      emailAddress,
      HttpStatus.BAD_REQUEST,
      constructUserNotFound(emailAddress)
    );
  }
  const isValidDomain = validateDomain(domainUrl);
  if (!isValidDomain) {
    return buildCSVUserUploadResponse(
      index,
      emailAddress,
      HttpStatus.BAD_REQUEST,
      constructClientDomainNotValid(domainUrl)
    );
  }

  const admins = await userDao.find(schema, {
    isAdmin: true,
    isDeleted: false
  });
  const adminDomains = admins?.map((user) => getDomainFromEmail(user.email));

  if (
    adminDomains?.includes(domainUrl) ||
    PROVIDER_DOMAIN_LIST.includes(domainUrl)
  ) {
    return buildCSVUserUploadResponse(
      index,
      emailAddress,
      HttpStatus.BAD_REQUEST,
      constructClientDomainUnprocessable(domainUrl)
    );
  }

  const clientDomain = await createIfNotExistClientDomain(schema, domainUrl);
  await createIfNotExistClientDomainUserMaping(
    schema,
    Number(user.id),
    Number(clientDomain.id)
  );
  return buildCSVUserUploadResponse(
    index,
    emailAddress,
    HttpStatus.OK,
    'success'
  );
}

/**
 * Processes uploaded client domain to user mapping
 *
 * @param results object[]
 */
export async function processSpecificClientDomainsUsers(
  schema: string,
  userId: number,
  results: any[]
) {
  await clientDomainUserMappingDao.update(
    schema,
    { providerUserId: userId },
    { isDeleted: true }
  );
  const domains = _.map(results, 'Domains');
  const uniqueDomains = [...new Set(domains)];
  const admins = await userDao.find(schema, {
    isAdmin: true,
    isDeleted: false
  });
  const adminDomains = admins?.map((user) => getDomainFromEmail(user.email));
  const response = await Promise.all(
    uniqueDomains.map(async (domain) => {
      try {
        const isValidDomain = validateDomain(domain);
        if (!isValidDomain) {
          return buildClientDomainResponse(
            domain,
            HttpStatus.BAD_REQUEST,
            constructClientDomainNotValid(domain)
          );
        }

        if (
          adminDomains?.includes(domain) ||
          PROVIDER_DOMAIN_LIST.includes(domain)
        ) {
          return buildClientDomainResponse(
            domain,
            HttpStatus.BAD_REQUEST,
            constructClientDomainUnprocessable(domain)
          );
        }

        const clientDomain = await createIfNotExistClientDomain(schema, domain);
        await createIfNotExistClientDomainUserMaping(
          schema,
          userId,
          Number(clientDomain.id)
        );
        return buildClientDomainResponse(domain, HttpStatus.OK, 'success');
      } catch (err) {
        logger.log('debug', err);
        return buildClientDomainResponse(
          domain,
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage.SomethingWentWrong
        );
      }
    })
  );
  return response;
}

/**
 * Checks if fields in csv of client domain to user mapping are empty.
 *
 * @param emailAddress string
 * @param domainUrl string
 */
export function areFieldsEmpty(
  emailAddress: string,
  domainUrl: string | string[]
) {
  if (emailAddress.length === 0) {
    return errorMessage.EmailAddressEmpty;
  }
  if (domainUrl.length === 0) {
    return errorMessage.DomainUrlEmpty;
  }
  return;
}

/**
 * Creates client domain if not exist.
 *
 * @param domain string
 */
export async function createIfNotExistClientDomain(
  schema: string,
  domain: string
) {
  const clientDomain = await clientDomainDao.findOne(schema, { domain });
  if (clientDomain) {
    if (clientDomain.isDeleted) {
      await clientDomainDao.update(
        schema,
        { id: clientDomain.id },
        { isDeleted: false }
      );
    }
    return clientDomain;
  } else {
    const newClientDomain = await clientDomainDao.create(schema, { domain });
    return newClientDomain;
  }
}

/**
 * Creates client domain user mapping if not exist
 *
 * @param providerUserId number
 * @param clientDomainId number
 */
export async function createIfNotExistClientDomainUserMaping(
  schema: string,
  providerUserId: number,
  clientDomainId: number
) {
  const clientDomainUser = await clientDomainUserMappingDao.findOne(schema, {
    providerUserId,
    clientDomainId
  });
  if (clientDomainUser) {
    if (clientDomainUser.isDeleted) {
      await clientDomainUserMappingDao.update(
        schema,
        { id: clientDomainUser.id },
        { isDeleted: false }
      );
    }
    return clientDomainUser.id;
  } else {
    const newClientDomainUser = await clientDomainUserMappingDao.create(
      schema,
      {
        providerUserId,
        clientDomainId,
        mappedDate: new Date().toISOString()
      }
    );
    return newClientDomainUser.id;
  }
}

/**
 * Downloads csv client domain list
 *
 * @returns string
 */
export async function downloadClientDomains(schema: string): Promise<string> {
  const clientDomains = await clientDomainDao.find(schema, {
    isDeleted: false
  });
  const clientDomainUrls = _.map(clientDomains, 'domain');
  const clientDomainsJson = clientDomainUrls.map((clientDomain) => {
    return {
      Domains: clientDomain
    };
  });
  return convertJsonToCSV(clientDomainCsvValidators, clientDomainsJson);
}

/**
 * Remove client domain.
 *
 * @param id number
 */
export async function removeClientDomain(
  schema: string,
  id: number
): Promise<void> {
  const clientDomain = await clientDomainDao.findOne(schema, {
    id,
    isDeleted: false
  });
  if (!clientDomain) {
    throw new BadRequestError(errorMessage.ClientDomainNotFound);
  }

  await clientDomainDao.update(schema, { id }, { isDeleted: true });
  await clientDomainUserMappingDao.update(
    schema,
    { clientDomainId: id },
    { isDeleted: true }
  );

  return;
}
