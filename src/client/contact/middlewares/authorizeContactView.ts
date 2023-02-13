import { Request, Response, NextFunction } from 'express';

import errorMessage from '../contact.errors';
import * as contactService from '../contact.service';
import { PRIMARY_SEARCH } from '../filter/contact.filter';
import { getContactAccessType } from './authorizeEmailView';
import ForbiddenError from '../../../core/exceptions/ForbiddenError';
import { getTenantSchemaName } from '../../../core/utils/recovoUtils';
import * as clientDomainDao from '../../clientDomain/clientDomain.dao';
import * as userSupervisorDao from '../../userMappings/userSupervisor.dao';
import { validateDomain } from '../../clientDomain/validators/domain.validator';
import VisibleProvidersInfo from '../../../client/messagePart/interfaces/visibleProvidersInfo.interface';
import { fetchVisibleEmailsProviderIds } from '../../../client/providerUserThread/providerUserThread.service';
/**
 * A middleware to authorize if the user is able to view the contact emails.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
async function authorizeContactView(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let clientDomainIds: number[] = [];
    let isClientDomainIdsEmpty = false;
    let clientContactIds: number[] = [];
    const query: any = req.query;
    const loggedInUser = res.locals.loggedInPayload;
    const tenantSchemaName = getTenantSchemaName(req.baseUrl);

    const clientDomains = await contactService.getClientDomainIdsByLoggedInUser(
      tenantSchemaName,
      loggedInUser,
      req.body
    );

    clientDomainIds = [...new Set(clientDomains.allClientDomains)];
    clientContactIds.push(
      ...clientDomains.domainMappingClientContacts,
      ...clientDomains.aliasClientContactIds,
      ...clientDomains.subordinateClientContactIds
    );

    clientContactIds = [...new Set(clientContactIds)];

    isClientDomainIdsEmpty = !clientDomainIds.length;

    if (PRIMARY_SEARCH in query) {
      // is searched domain forbidden to view
      if (validateDomain(query[PRIMARY_SEARCH])) {
        const clientDomain = await clientDomainDao.findOne(tenantSchemaName, {
          domain: query[PRIMARY_SEARCH]
        });

        if (clientDomain && !clientDomainIds.includes(clientDomain.id)) {
          throw new ForbiddenError(errorMessage.ForbiddenDomain);
        }
      }

      // is searched gmail forbidden to view
      const contact = await contactService.findByEmail(
        tenantSchemaName,
        query[PRIMARY_SEARCH]
      );
      if (contact && !clientDomainIds.includes(contact.clientDomainId)) {
        throw new ForbiddenError(errorMessage.ForbiddenDomain);
      }
    }
    const contacts = await contactService.findByIds(
      tenantSchemaName,
      clientContactIds
    );

    const supervisorMappings = await userSupervisorDao.find(tenantSchemaName, {
      supervisorId: loggedInUser.userId,
      isDeleted: false
    });

    if (contacts) {
      await Promise.all(
        clientContactIds.map(async (_id, index) => {
          const contactWithAccessType = getContactAccessType(
            clientDomains,
            contacts[index]
          );
          const visibleProvidersInfo: VisibleProvidersInfo[] = await fetchVisibleEmailsProviderIds(
            tenantSchemaName,
            contactWithAccessType,
            loggedInUser,
            supervisorMappings
          );
          const visibleProvidersInfos = {
            data: visibleProvidersInfo,
            contactId: contacts[index].id
          };
          res.locals.visibleProvidersInfos = res.locals.visibleProvidersInfos
            ? [...res.locals.visibleProvidersInfos, visibleProvidersInfos]
            : [visibleProvidersInfos];
        })
      );
    }

    res.locals.clientDomainIds = clientDomainIds;
    res.locals.clientContactIds = clientContactIds;
    res.locals.isClientDomainIdsEmpty = isClientDomainIdsEmpty;
    next();
  } catch (err) {
    next(err);
  }
}

export default authorizeContactView;
