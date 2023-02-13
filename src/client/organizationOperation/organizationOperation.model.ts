import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import OnboardingStatuses from '../common/constants/oboardingSteps';
import { Transaction } from 'knex';

/**
 * organizationOperation Model
 */
class OrganizationOperation extends BaseModel {
  public static table: string = Table.ORGANIZATION_OPERATION;

  /**
   * Function that sends the next transition from current onboardingStep
   * @param currentStep string
   * @returns onboardingStep
   */
  public static getNextOnboardingStep(currentStep: string) {
    switch (currentStep) {
      case OnboardingStatuses.onboardingStatus.NOT_STARTED.value:
        return OnboardingStatuses.onboardingStatus.COMPANY_INFO;
      case OnboardingStatuses.onboardingStatus.COMPANY_INFO.value:
        return OnboardingStatuses.onboardingStatus.CREDENTIAL_UPLOAD;
      case OnboardingStatuses.onboardingStatus.CREDENTIAL_UPLOAD.value:
        return OnboardingStatuses.onboardingStatus.DOMAINS_UPLOAD;
      case OnboardingStatuses.onboardingStatus.DOMAINS_UPLOAD.value:
        return OnboardingStatuses.onboardingStatus.AWAITING_FETCH;
      case OnboardingStatuses.onboardingStatus.AWAITING_FETCH.value:
        return OnboardingStatuses.onboardingStatus.COMPLETED;
      default:
        return OnboardingStatuses.onboardingStatus.COMPLETED;
    }
  }

  /**
   * Find first record according to query
   *
   * @param {number} id
   * @param {callback} callback
   * @param {Knex.Transaction} trx
   * @returns {Knex.QueryBuilder}
   */
  public static findFirstRecord(
    schema: string,
    params: any,
    callback?: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.ORGANIZATION_OPERATION)
      .withSchema(schema);

    qb.select('*')
      .where(params)
      .limit(1)
      .then(([result]: any) => {
        return result ? result : null;
      });

    if (callback) callback(qb);

    return qb.then(([result]: any) => {
      return result;
    });
  }

  /**
   * Update record
   * @param schema string
   * @param searchParams param
   * @param updateParams object
   */
  public static updateOrganizationOperation(
    schema: string,
    searchParams: any,
    updateParams: any,
    trx?: Transaction
  ) {
    const qb = super
      .queryBuilder(trx)(Table.ORGANIZATION_OPERATION)
      .withSchema(schema)
      .update(updateParams)
      .where(searchParams)
      .returning('*');
    return qb;
  }
}

export default OrganizationOperation;
