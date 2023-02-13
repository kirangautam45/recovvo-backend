import Joi from 'joi';
import { ServiceType } from '../enums/serviceType.enum';

/**
 * Provider validator
 */
const providerValidator: any = Joi.object({
  service_type: Joi.string()
    .min(2)
    .max(15)
    .label('Service type')
    .valid(ServiceType.GSUITE)
    .required()
});

/**
 * Tenant validator
 */
const tenantValidator: any = Joi.object({
  azureTenantId: Joi.string().guid().label('Azure Tenant id').required()
});

export { providerValidator, tenantValidator };
