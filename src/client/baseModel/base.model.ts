import { createBaseModel } from '@leapfrogtechnology/db-model';
import { tenantConnection } from '../../core/config/knex';

export const BaseModel = createBaseModel().bind(tenantConnection);
