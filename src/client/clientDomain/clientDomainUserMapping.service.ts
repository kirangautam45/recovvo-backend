import * as HttpStatus from 'http-status-codes';

import * as userDao from '../user/user.dao';
import logger from '../../core/utils/logger';
import messages from './clientDomain.messages';
import errorMessage from './clientDomain.errors';
import * as clientDomainDao from './clientDomain.dao';
import { convertJsonToCSV } from '../../core/utils/csv';
import { validateDomain } from './validators/domain.validator';
import { getDomainFromEmail } from '../../core/utils/recovoUtils';
import BadRequestError from '../../core/exceptions/BadRequestError';
import * as clientDomainUserMappingDao from './clientDomainUserMapping.dao';
import { buildClientDomainResponse } from '../../core/utils/buildJSONResponse';
import { PROVIDER_DOMAIN_LIST } from '../common/constants/exclusionList';
import {
  constructClientDomainNotFound,
  constructClientDomainNotValid,
  constructClientDomainUnprocessable
} from '../../core/utils/errorMessage';

import {
  createIfNotExistClientDomainUserMaping,
  createIfNotExistClientDomain
} from './clientDomain.service';
import {
  clientDomainUserHeaders,
  clientDomainUserValidators
} from './validators/clientDomainUserMapping.validator';

/**
 * Map a list of Domain ids to a user
 * @param userId number
 * @param domainUrls string[]
 */
export async function mapDomainsToUser(
  schema: string,
  userId: number,
  domainUrls: string[]
) {
  const total: number = domainUrls.length;
  let error = 0;
  let mapped = 0;

  const uniqueDomainUrls = [...new Set(domainUrls)];
  const admins = await userDao.find(schema, {
    isAdmin: true,
    isDeleted: false
  });

  const adminDomains = admins?.map((user) => getDomainFromEmail(user.email));

  const data = await Promise.all(
    uniqueDomainUrls.map(async (domain) => {
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

        if (!clientDomain) {
          error++;

          return buildClientDomainResponse(
            domain,
            HttpStatus.BAD_REQUEST,
            constructClientDomainNotFound(domain)
          );
        }

        await createIfNotExistClientDomainUserMaping(
          schema,
          Number(userId),
          Number(clientDomain.id)
        );

        mapped++;

        return { domain, status: HttpStatus.CREATED };
      } catch (err) {
        logger.log('debug', err);

        error++;

        return buildClientDomainResponse(
          domain,
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage.SomethingWentWrong
        );
      }
    })
  );

  return { data, meta: { total, error, mapped } };
}

/**
 * Unmap a domain from a user.
 * @param providerUserId Number
 * @param clientDomainId Number
 */
export async function unmapDomainFromUser(
  schema: string,
  providerUserId: number,
  clientDomainId: number
) {
  const clientDomainUserMapping = await clientDomainUserMappingDao.findOne(
    schema,
    {
      providerUserId,
      clientDomainId,
      isDeleted: false
    }
  );
  if (!clientDomainUserMapping) {
    throw new BadRequestError(errorMessage.DomainMappingNotFound);
  }

  const data = await clientDomainUserMappingDao.update(
    schema,
    { id: clientDomainUserMapping.id },
    { isDeleted: true }
  );

  return {
    data,
    message: messages.SuccessfullyUnmapped,
    code: HttpStatus.OK
  };
}

/**
 * Fetch valid domains for a user.
 * @param providerUserId Number
 * @param clientDomainId Number
 */
export async function fetchDomainsOfUser(
  schema: string,
  providerUserId: number,
  query: any
) {
  const response = await clientDomainUserMappingDao.fetchMappedDomainsWithFilter(
    schema,
    providerUserId,
    query
  );
  if (!response) {
    return {
      message: errorMessage.DomainMappingNotFound,
      status: HttpStatus.BAD_REQUEST
    };
  }

  return response;
}

/**
 * Downloads csv with user and mapped client domain users
 *
 * @returns string
 */
export async function downloadClientDomainUsers(
  schema: string
): Promise<string> {
  const users = await userDao.find(schema, {
    isDeleted: false,
    isAppUser: true
  });
  const clientDomainUsers = await clientDomainUserMappingDao.find(schema, {
    isDeleted: false
  });
  const clientDomains = await clientDomainDao.find(schema, {
    isDeleted: false
  });
  const userClientDomainsJson = clientDomainUsers.map((clientDomainUser) => {
    const user = users?.find(
      (user) => user.id === clientDomainUser.providerUserId
    );
    const clientDomain = clientDomains.find(
      (clientDomain) => clientDomain.id === clientDomainUser.clientDomainId
    );
    return {
      [clientDomainUserHeaders.emailAddress]: user?.email,
      [clientDomainUserHeaders.domainUrl]: clientDomain?.domain
    };
  });
  return convertJsonToCSV(clientDomainUserValidators, userClientDomainsJson);
}
