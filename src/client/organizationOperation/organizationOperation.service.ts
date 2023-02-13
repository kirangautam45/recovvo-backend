import moment from 'moment';

import logger from '../../core/utils/logger';
import { boolify } from '../../core/utils/string';
import errorMessage from './organizationOperation.errors';
import OrganizationOperation from './organizationOperation.model';
import BadRequestError from '../../core/exceptions/BadRequestError';
import * as organizationOperationDao from './organizationOperation.dao';
import AccessExpirationPayload from './dto/AccessExpirationPayload.dto';
import EmailAccessTimeFramePayload from './dto/EmailAccessTimeFrame.dto';
import { getTimeRangeInDays, getTimeRangeInYears } from '../../core/utils/date';
import IEmailAccessTimeFrame from './interfaces/emailAccessTimeFrame.interface';
import IdefaultAccessExpiration from './interfaces/defaultAccessExpiration.interface';
import * as suppressionListService from './../suppressionList/suppressionList.service';
import {
  ACTIVE,
  INACTIVE,
  UNLIMITED_ACCESS,
  UNLIMITED_EXPIRATION
} from './organizationOperation.constant';
import {
  DAYS,
  DEFAULT_DATE_FORMAT
} from '../common/constants/dateTimeConstants';

/**
 * Fetch onboarding step
 */
export async function fetchCurrentOnboardingStep(
  schema: string,
  serviceType: string
) {
  logger.info('Fetching the onboarding step from organization operations info');

  return await organizationOperationDao.fetchCurrentOnboardingStep(
    schema,
    serviceType
  );
}

/**
 *
 * @param organizationId : number
 */
export async function fetchbyOrganizationId(
  schema: string,
  organizationId: number
) {
  logger.info('Fetching the onboarding step from organization operations info');
  return await organizationOperationDao.findOne(schema, { organizationId });
}

/**
 * Returns the statuses of the data settings.
 *
 * @param {String} schema
 * @param {Number} id
 */
export async function getAccountSettingStatuses(schema: string, id: number) {
  const organizationOpInfo = await organizationOperationDao.findFirstById(
    schema,
    id
  );
  const suppressionListStatus = await suppressionListService.getSuppressionStatus(
    schema
  );

  return {
    suppressionListEnabled: suppressionListStatus,
    defaultCollaboratorExpirySet: organizationOpInfo.isDefaultCollaboratorExpirySet
      ? ACTIVE
      : INACTIVE,
    defaultAliasHistoryExpirySet: organizationOpInfo.isDefaultAliasExpirySet
      ? ACTIVE
      : INACTIVE,
    emailAccessTimeFrameSet: organizationOpInfo.isEmailAccessTimeFrameSet
      ? ACTIVE
      : INACTIVE
  };
}

/**
 * Update the onboarding step value
 * @param currentStep string
 * @param id number Id of the organizationOperation record
 * @returns {id: number, onboardingStep: sting} object with new onboarding step
 */
export async function updateOnboardingStep(
  schema: string,
  currentStep: string,
  id: number
) {
  const organizationOperation = await organizationOperationDao.findFirstById(
    schema,
    id
  );
  if (!organizationOperation) {
    throw new BadRequestError(errorMessage.IdNotFound);
  }

  if (currentStep !== organizationOperation.onboardingStep) {
    throw new BadRequestError(errorMessage.StepsDoNotMatch);
  }

  const nextOnboardingStep = OrganizationOperation.getNextOnboardingStep(
    currentStep
  );

  const updatedOrganizationInfo: any = await organizationOperationDao.add(
    schema,
    organizationOperation.id,
    {
      onboardingStep: nextOnboardingStep.value,
      onboardingPage: nextOnboardingStep.onboardingPage
    }
  );
  return {
    id: updatedOrganizationInfo.id,
    onboardingPage: updatedOrganizationInfo.onboardingPage,
    onboardingStep: updatedOrganizationInfo.onboardingStep
  };
}

/**
 * Update the default collaboratory access expiration value
 * @param schema string
 * @param isDefaultExpirySet
 * @param defaultExpiryDuration
 * @param id number Id of the organizationOperation record
 * @returns {id: number, isDefaultExpirySet: boolean, defaultExpiryDuration: number}
 */
export async function updateDefaultCollaboratorExpiry(
  schema: string,
  reqBody: AccessExpirationPayload,
  id: number
): Promise<IdefaultAccessExpiration> {
  const organizationOperation = await organizationOperationDao.findFirstById(
    schema,
    id
  );

  const isDefaultExpirySet: boolean = reqBody.isDefaultExpirySet;
  let defaultExpiryDuration: number | null = reqBody.defaultExpiryDuration;

  if (!organizationOperation) {
    throw new BadRequestError(errorMessage.OrganizationOperationNotFound);
  }

  if (!isDefaultExpirySet) {
    defaultExpiryDuration = UNLIMITED_EXPIRATION;
  } else if (isDefaultExpirySet && defaultExpiryDuration === null) {
    throw new BadRequestError(errorMessage.InvalidExpiryDuration);
  }

  const updatedDefaultExpiryInfo: any = await organizationOperationDao.add(
    schema,
    organizationOperation.id,
    {
      isDefaultCollaboratorExpirySet: isDefaultExpirySet,
      defaultCollaboratorExpiryDuration: defaultExpiryDuration
    }
  );

  return {
    id: updatedDefaultExpiryInfo.id,
    isDefaultExpirySet: updatedDefaultExpiryInfo.isDefaultCollaboratorExpirySet,
    defaultExpiryDuration:
      updatedDefaultExpiryInfo.defaultCollaboratorExpiryDuration
  };
}

/**
 * Update the default alias access expiration value
 * @param schema string
 * @param isDefaultExpirySet
 * @param defaultExpiryDuration
 * @param id number Id of the organizationOperation record
 * @returns {id: number, isDefaultExpirySet: boolean, defaultExpiryDuration: number}
 */
export async function updateDefaultAliasExpiry(
  schema: string,
  reqBody: AccessExpirationPayload,
  id: number
): Promise<IdefaultAccessExpiration> {
  const organizationOperation = await organizationOperationDao.findFirstById(
    schema,
    id
  );

  const isDefaultExpirySet: boolean = reqBody.isDefaultExpirySet;
  let defaultExpiryDuration: number | null = reqBody.defaultExpiryDuration;

  if (!organizationOperation) {
    throw new BadRequestError(errorMessage.OrganizationOperationNotFound);
  }

  if (!isDefaultExpirySet) {
    defaultExpiryDuration = UNLIMITED_EXPIRATION;
  } else if (isDefaultExpirySet && defaultExpiryDuration === null) {
    throw new BadRequestError(errorMessage.InvalidExpiryDuration);
  }

  const updatedDefaultExpiryInfo: any = await organizationOperationDao.add(
    schema,
    organizationOperation.id,
    {
      isDefaultAliasExpirySet: isDefaultExpirySet,
      defaultAliasExpiryDuration: defaultExpiryDuration
    }
  );

  return {
    id: updatedDefaultExpiryInfo.id,
    isDefaultExpirySet: updatedDefaultExpiryInfo.isDefaultAliasExpirySet,
    defaultExpiryDuration: updatedDefaultExpiryInfo.defaultAliasExpiryDuration
  };
}

/**
 * Update email access time frame
 * @param schema
 * @param reqBody
 * @param id
 */
export async function updateEmailAccessTimeFrame(
  schema: string,
  reqBody: EmailAccessTimeFramePayload,
  id: number
): Promise<IEmailAccessTimeFrame> {
  const organizationOperation = await organizationOperationDao.findFirstById(
    schema,
    id
  );

  const isEmailAccessTimeFrameSet: boolean = boolify(
    reqBody.isEmailAccessTimeFrameSet
  );
  const isRollingTimeFrameSet: boolean = boolify(reqBody.isRollingTimeFrameSet);
  let emailAccessStartDate: string | null = reqBody.emailAccessStartDate; //null being all access

  if (!organizationOperation) {
    throw new BadRequestError(errorMessage.OrganizationOperationNotFound);
  }

  if (!isEmailAccessTimeFrameSet) {
    emailAccessStartDate = null;
  }

  const currentDate = moment().format(DEFAULT_DATE_FORMAT);

  let updateParams: any = {
    isEmailAccessTimeFrameSet,
    isRollingTimeFrameSet,
    emailAccessStartDate,
    emailAccessTimeRangeInYears: UNLIMITED_ACCESS,
    emailAccessTimeRangeInDays: UNLIMITED_ACCESS
  };

  if (isEmailAccessTimeFrameSet) {
    updateParams = {
      ...updateParams,
      emailAccessStartDate,
      emailAccessTimeRangeInYears: getTimeRangeInYears(
        currentDate,
        emailAccessStartDate
      ),
      emailAccessTimeRangeInDays: getTimeRangeInDays(
        currentDate,
        emailAccessStartDate
      )
    };
  }

  const updatedEmailAccessInfo: any = await organizationOperationDao.add(
    schema,
    organizationOperation.id,
    updateParams
  );

  return {
    id: updatedEmailAccessInfo.id,
    isEmailAccessTimeFrameSet: updatedEmailAccessInfo.isEmailAccessTimeFrameSet,
    isRollingTimeFrameSet: updatedEmailAccessInfo.isRollingTimeFrameSet,
    emailAccessStartDate: !updatedEmailAccessInfo.emailAccessStartDate
      ? null
      : moment(updatedEmailAccessInfo.emailAccessStartDate).format(
          DEFAULT_DATE_FORMAT
        ),
    emailAccessTimeRangeInYears:
      updatedEmailAccessInfo.emailAccessTimeRangeInYears,
    emailAccessTimeRangeInDays:
      updatedEmailAccessInfo.emailAccessTimeRangeInDays
  };
}

/**
 * get the default collaborator access expiration information
 * @param schema string
 * @param id number Id of the organizationOperation record
 * @returns {isDefaultExpirySet: boolean, defaultExpiryDuration: number} object
 */
export async function getDefaultCollaboratorExpiry(
  schema: string,
  id: number
): Promise<IdefaultAccessExpiration> {
  const organizationOperation = await organizationOperationDao.findFirstById(
    schema,
    id
  );

  if (!organizationOperation) {
    throw new BadRequestError(errorMessage.IdNotFound);
  }

  return {
    id: organizationOperation.id,
    isDefaultExpirySet: organizationOperation.isDefaultCollaboratorExpirySet,
    defaultExpiryDuration:
      organizationOperation.defaultCollaboratorExpiryDuration
  };
}

/**
 * get the default alias history expiration information
 * @param schema string
 * @param id number Id of the organizationOperation record
 * @returns {isDefaultExpirySet: boolean, defaultExpiryDuration: number} object
 */
export async function getDefaultAliasExpiry(
  schema: string,
  id: number
): Promise<IdefaultAccessExpiration> {
  const organizationOperation = await organizationOperationDao.findFirstById(
    schema,
    id
  );

  if (!organizationOperation) {
    throw new BadRequestError(errorMessage.IdNotFound);
  }

  return {
    id: organizationOperation.id,
    isDefaultExpirySet: organizationOperation.isDefaultAliasExpirySet,
    defaultExpiryDuration: organizationOperation.defaultAliasExpiryDuration
  };
}

/**
 *
 * @param schema string
 * @param id number
 */
export async function getCurrentAccessStartDate(
  schema: string
): Promise<IEmailAccessTimeFrame> {
  const organizationOperation = await organizationOperationDao.findFirstRecord(
    schema
  );

  if (!organizationOperation) {
    throw new BadRequestError(errorMessage.IdNotFound);
  }

  const {
    isEmailAccessTimeFrameSet,
    isRollingTimeFrameSet
  } = organizationOperation;

  let {
    emailAccessStartDate,
    emailAccessTimeRangeInYears,
    emailAccessTimeRangeInDays
  } = organizationOperation;

  emailAccessStartDate = !emailAccessStartDate
    ? null
    : moment(emailAccessStartDate).format(DEFAULT_DATE_FORMAT); //strip off timestamp

  const currentDate = moment().format(DEFAULT_DATE_FORMAT);

  if (
    !!emailAccessStartDate &&
    moment(emailAccessStartDate).isBefore(moment(currentDate))
  ) {
    if (isRollingTimeFrameSet) {
      emailAccessStartDate = moment(currentDate, DEFAULT_DATE_FORMAT)
        .subtract(emailAccessTimeRangeInDays, DAYS)
        .format(DEFAULT_DATE_FORMAT);
    } else {
      emailAccessTimeRangeInDays = getTimeRangeInDays(
        currentDate,
        emailAccessStartDate
      );
      emailAccessTimeRangeInYears = getTimeRangeInYears(
        currentDate,
        emailAccessStartDate
      );
    }
  }

  return {
    id: organizationOperation.id,
    isEmailAccessTimeFrameSet,
    isRollingTimeFrameSet,
    emailAccessStartDate,
    emailAccessTimeRangeInDays,
    emailAccessTimeRangeInYears
  };
}

/**
 * get the email access time frame information as well as updates the values
 * @param schema string
 * @param id number
 * @returns {isEmailAccessTimeFrameSet: boolean,
 *          isRollingTimeFrameSet: boolean,
 *          emailAccessStartDate: string,
 *          emailAccessTimeRangeInYears: number,
 *          emailAccessTimeRangeInDays:number} object
 */
export async function getEmailAccessTimeFrame(
  schema: string
): Promise<IEmailAccessTimeFrame> {
  const {
    id,
    isEmailAccessTimeFrameSet,
    isRollingTimeFrameSet,
    emailAccessStartDate,
    emailAccessTimeRangeInDays,
    emailAccessTimeRangeInYears
  } = await getCurrentAccessStartDate(schema);

  await updateEmailAccessTimeFrame(
    schema,
    {
      isEmailAccessTimeFrameSet,
      isRollingTimeFrameSet,
      emailAccessStartDate
    },
    id
  );

  return {
    id,
    isEmailAccessTimeFrameSet,
    isRollingTimeFrameSet,
    emailAccessStartDate,
    emailAccessTimeRangeInYears,
    emailAccessTimeRangeInDays
  };
}
