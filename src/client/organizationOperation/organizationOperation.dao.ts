import logger from '../../core/utils/logger';
import * as providerService from '../provider/provider.service';
import OrganizationOperation from './organizationOperation.model';

/**
 * Get the first record of organizationOperation and return onboardingStep
 * @returns {onboardingStep: currentOnboardingStep}
 */
export async function fetchCurrentOnboardingStep(
  schema: string,
  serviceType: string
): Promise<any> {
  logger.info('Fetching organization operation info');
  const organizationOperation: any = await OrganizationOperation.findFirstRecord(
    schema,
    {}
  );

  const provider: any = await providerService.findOne(schema, {
    serviceType
  });

  return {
    id: organizationOperation?.id,
    onboardingPage: organizationOperation?.onboardingPage,
    onboardingStep: organizationOperation?.onboardingStep,
    isTenantIdRecieved: provider?.isTenantIdRecieved
  };
}

/**
 * find organization operation by query
 * @returns {onboardingStep: currentOnboardingStep}
 */
export async function findOne(schema: string, query: any): Promise<any> {
  logger.info('Fetching organization operation info');
  const organizationOperation: any = await OrganizationOperation.findFirstRecord(
    schema,
    query
  );
  return {
    id: organizationOperation?.id,
    onboardingPage: organizationOperation?.onboardingPage,
    onboardingStep: organizationOperation?.onboardingStep,
    defaultCollaboratorExpiryDuration:
      organizationOperation?.defaultCollaboratorExpiryDuration,
    isDefaultCollaboratorExpirySet:
      organizationOperation?.isDefaultCollaboratorExpirySet
  };
}

/**
 * Fetch first organizationOperation match by id
 * @param id number
 */
export async function findFirstById(schema: string, id: number): Promise<any> {
  logger.info('Fetch the organization operation info from id', id);
  return OrganizationOperation.findFirstRecord(schema, { id });
}

/**
 * Update organizationOperation
 *
 * @param id number
 * @returns Promise
 */
export async function add(schema: string, id: number, updateParams: any) {
  logger.info('Updating organization operation info ', updateParams);
  const [
    organizationOperation
  ] = await OrganizationOperation.updateOrganizationOperation(
    schema,
    { id },
    updateParams
  );

  return organizationOperation;
}

/**
 * Get the first organizationOperation record
 */
export async function findFirstRecord(schema: string): Promise<any> {
  logger.info('Get the first organization operation');
  return OrganizationOperation.findFirstRecord(schema, {});
}

/**
 * Update organization by id
 * @param id number
 * @param params object
 */
export async function updateById(
  schema: string,
  id: number,
  params: any
): Promise<any> {
  logger.log(
    'info',
    `Update organization with id ${id} with parameters ${params}`
  );
  return await OrganizationOperation.updateOrganizationOperation(
    schema,
    { id },
    params
  );
}
