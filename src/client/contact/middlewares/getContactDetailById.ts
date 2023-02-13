import { Request, Response, NextFunction } from 'express';
import * as _ from 'lodash';

import * as contactService from '../contact.service';
import { getTenantSchemaName } from '../../../core/utils/recovoUtils';

async function getContactDetailByUserId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const tenantSchemaName = getTenantSchemaName(req.baseUrl);
  const contact = await contactService.findById(
    tenantSchemaName,
    Number(req.params.id)
  );

  res.locals.contact = _.pick(contact, [
    'id',
    'firstName',
    'lastName',
    'email'
  ]);

  next();
}

async function getContactDetailByProviderUserThreadId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const tenantSchemaName = getTenantSchemaName(req.baseUrl);
  const clientDomainEmail = await contactService.findByProviderUserThreadId(
    tenantSchemaName,
    Number(req.params.id)
  );

  res.locals.clientEmailDomain = clientDomainEmail.senderReceiverUserEmail;
  next();
}

export { getContactDetailByUserId, getContactDetailByProviderUserThreadId };
