import { commonDbKnex } from '../../core/config/knex';
import { createBaseModel } from '@leapfrogtechnology/db-model';

export const BaseModel = createBaseModel().bind(commonDbKnex);
