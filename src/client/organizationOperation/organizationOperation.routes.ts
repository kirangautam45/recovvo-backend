import { Router } from 'express';
import { schema } from '../../core/middlewares/validate';
import authorize from '../../core/middlewares/authorize';
import authenticate from '../../core/middlewares/authenticate';
import { onboardingValidator } from './validators/onboarding.validator';
import * as organizationOperationController from './organizationOperation.controller';
import { emailAccessExpirationValidator } from './validators/emailAccessExpiration.validator';
import { defaultAccessExpirationValidator } from './validators/defaultAccessExpiration.validator';

const router: Router = Router();

/**
 * @swagger
 * /tenant/{tenantId}/organization-operation/onboarding-step:
 *  get:
 *    tags:
 *      [Onboarding]
 *    security:
 *       - BearerAuth: []
 *    description: 'Organization onboarding steps'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          data:
 *           type: object
 *           properties:
 *            id:
 *             type: 'string'
 *            onboardingPage:
 *             type: 'number'
 *            onboardingStep:
 *             type: 'string'
 *            isTenantRecieved:
 *             type: 'boolean'
 */
router.get(
  '/onboarding-step',
  authenticate,
  organizationOperationController.fetchCurrentOnboardingStep
);

/**
 * @swagger
 * /tenant/{tenantId}/organization-operation/onboarding-statuses:
 *  get:
 *    tags:
 *      [Onboarding]
 *    security:
 *      - BearerAuth: []
 *    description: 'Organization onboarding statuses'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          data:
 *           type: object
 *           properties:
 *            onboardingStatus:
 *             type: 'object'
 */
router.get(
  '/onboarding-statuses',
  authenticate,
  organizationOperationController.getOnboardingStatuses
);

/**
 * @swagger
 * /tenant/{tenantId}/organization-operation/update-onboarding-step:
 *  post:
 *    tags:
 *      [Onboarding]
 *    security:
 *       - BearerAuth: []
 *    description: 'Updating Organization onboarding statuses'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    requestBody:
 *     description: Current step value
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         currentStep:
 *          type:'string'
 *       examples:
 *        json:
 *          value: {
 *            currentStep: 'awaiting-fetch'}
 *       required:
 *         -currentStep
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          data:
 *           type: object
 *           properties:
 *            id:
 *             type:'number'
 *            onboardingPage:
 *             type: 'string'
 *            onboardingStep:
 *             type: 'number'
 */
router.post(
  '/update-onboarding-step',
  authenticate,
  authorize,
  schema(onboardingValidator),
  organizationOperationController.updateOnboardingStep
);

/**
 * @swagger
 * /tenant/{tenantId}/organization-operation/update-default-collaborator-expiry:
 *  patch:
 *    tags:
 *      [Admin]
 *    security:
 *       - BearerAuth: []
 *    description: 'Update default collaborator expiry'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    requestBody:
 *     description: Json value for default collaborator expiry
 *     content:
 *      application/json:
 *        schema:
 *         type: object
 *         properties:
 *          isDefaultExpirySet:
 *           type: boolean
 *          defaultExpiryDuration:
 *           type: number
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          data:
 *           type: 'object'
 *           properties:
 *            id:
 *             type: 'number'
 *            isDefaultExpirySet:
 *             type: 'boolean'
 *            defaultExpiryDuration:
 *             type: 'number'
 *             example: 1
 *     400:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          code:
 *           type: 'number'
 *           example: 400
 *          message:
 *           type: 'string'
 *           example: 'Bad Request'
 *          data:
 *           type: 'array'
 *           items:
 *            schema:
 *             type: 'object'
 *             properties:
 *              param:
 *               type: 'string'
 *              message:
 *               type: 'string'
 *            example:
 *             - param: 'defaultExpiryDuration'
 *               message: '"defaultExpiryDuration" must be a positive number"'
 *             - param: 'defaultExpiryDuration'
 *               message: '"defaultExpiryDuration" must be a greater than zero"'
 */
router.patch(
  '/update-default-collaborator-expiry',
  authenticate,
  authorize,
  schema(defaultAccessExpirationValidator),
  organizationOperationController.updateDefaultCollaboratorExpiry
);

/**
 * @swagger
 * /tenant/{tenantId}/organization-operation/update-default-alias-expiry:
 *  patch:
 *    tags:
 *      [Admin]
 *    security:
 *       - BearerAuth: []
 *    description: 'Update default alias expiry'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    requestBody:
 *     description: Json value for default collaborator expiry
 *     content:
 *      application/json:
 *        schema:
 *         type: object
 *         properties:
 *          isDefaultExpirySet:
 *           type: boolean
 *          defaultExpiryDuration:
 *           type: number
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          data:
 *           type: 'object'
 *           properties:
 *            id:
 *             type: 'number'
 *            isDefaultExpirySet:
 *             type: 'boolean'
 *            defaultExpiryDuration:
 *             type: 'number'
 *             example: 2
 *     400:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          code:
 *           type: 'number'
 *           example: 400
 *          message:
 *           type: 'string'
 *           example: 'Bad Request'
 *          data:
 *           type: 'array'
 *           items:
 *            schema:
 *             type: 'object'
 *             properties:
 *              param:
 *               type: 'string'
 *              message:
 *               type: 'string'
 *            example:
 *             - param: 'defaultExpiryDuration'
 *               message: '"defaultExpiryDuration" must be a positive number"'
 *             - param: 'defaultExpiryDuration'
 *               message: '"defaultExpiryDuration" must be a greater than zero"'
 */
router.patch(
  '/update-default-alias-expiry',
  authenticate,
  authorize,
  schema(defaultAccessExpirationValidator),
  organizationOperationController.updateDefaultAliasExpiry
);

/**
 * @swagger
 * /tenant/{tenantId}/organization-operation/default-collaborator-expiry:
 *  get:
 *    tags:
 *      [Admin]
 *    security:
 *       - BearerAuth: []
 *    description: 'return default collaborator expiry information'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          data:
 *           type: 'object'
 *           properties:
 *            id:
 *             type: 'number'
 *             example: 3
 *            isDefaultExpirySet:
 *             type: 'boolean'
 *            defaultExpiryDuration:
 *             type: 'number'
 *             example: 1
 *     404:
 *      description: 'uri error'
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          error:
 *           type: 'object'
 *           properties:
 *            code:
 *             type: 'number'
 *             example: 404
 *            message:
 *             type: 'string'
 *             example: 'Not Found'
 */
router.get(
  '/default-collaborator-expiry',
  authenticate,
  authorize,
  organizationOperationController.getDefaultCollaboratorExpiry
);

/**
 * @swagger
 * /tenant/{tenantId}/organization-operation/default-alias-expiry:
 *  get:
 *    tags:
 *      [Admin]
 *    security:
 *       - BearerAuth: []
 *    description: 'return default alias expiry information'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          data:
 *           type: 'object'
 *           properties:
 *            id:
 *             type: 'number'
 *             example: 1
 *            isDefaultExpirySet:
 *             type: 'boolean'
 *            defaultExpiryDuration:
 *             type: 'number'
 *             example: 3
 *     404:
 *      description: 'uri error'
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          error:
 *           type: 'object'
 *           properties:
 *            code:
 *             type: 'number'
 *             example: 404
 *            message:
 *             type: 'string'
 *             example: 'Not Found'
 */
router.get(
  '/default-alias-expiry',
  authenticate,
  authorize,
  organizationOperationController.getDefaultAliasExpiry
);

/**
 * @swagger
 * /tenant/{tenantId}/organization-operation/default-email-access:
 *  patch:
 *    tags:
 *      [Admin]
 *    security:
 *       - BearerAuth: []
 *    description: 'updates default email access time frame'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    requestBody:
 *     description: Value for default email access time frame
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         isEmailAccessTimeFrameSet:
 *          type:'boolean'
 *         isRollingTimeFrameSet:
 *          type:'boolean'
 *         emailAccessStartDate:
 *          type:'string'
 *       examples:
 *        json:
 *          value: {
 *            isEmailAccessTimeFrameSet: true,
 *            isRollingTimeFrameSet: true,
 *            emailAccessStartDate: '2021-04-10' }
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          code:
 *           type: 'number'
 *           example: 200
 *          data:
 *           type: 'object'
 *           properties:
 *            id:
 *             type: 'number'
 *             example: 1
 *            isEmailAccessTimeFrameSet:
 *             type: 'boolean'
 *             example: true
 *            isRollingTimeFrameSet:
 *             type: 'boolean'
 *             example: true
 *            emailAccessStartDate:
 *             type: 'string | null'
 *             example: null
 *            emailAccessTimeRangeInYears:
 *             type: 'number'
 *             example: 1
 *            emailAccessTimeRangeInDays:
 *             type: 'number'
 *             example: 200
 */
router.patch(
  '/default-email-access',
  authenticate,
  authorize,
  schema(emailAccessExpirationValidator),
  organizationOperationController.updateEmailAccessTimeFrame
);

/**
 * @swagger
 * /tenant/{tenantId}/organization-operation/default-email-access:
 *  get:
 *    tags:
 *      [Admin]
 *    security:
 *       - BearerAuth: []
 *    description: 'gets default email access time frame'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          code:
 *           type: 'number'
 *           example: 200
 *          data:
 *           type: 'object'
 *           properties:
 *            id:
 *             type: 'number'
 *             example: 1
 *            isEmailAccessTimeFrameSet:
 *             type: 'boolean'
 *             example: true
 *            isRollingTimeFrameSet:
 *             type: 'boolean'
 *             example: true
 *            emailAccessStartDate:
 *             type: 'string | null'
 *             example: null
 *            emailAccessTimeRangeInYears:
 *             type: 'number'
 *             example: 1
 *            emailAccessTimeRangeInDays:
 *             type: 'number'
 *             example: 200
 */
router.get(
  '/default-email-access',
  authenticate,
  authorize,
  organizationOperationController.getEmailAccessTimeFrame
);

/**
 * @swagger
 * /tenant/{tenantId}/organization-operation/account-setting-statuses:
 *  get:
 *    tags:
 *      [Admin]
 *    security:
 *       - BearerAuth: []
 *    description: 'gets organiztion data setting statuses'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: 'object'
 *         properties:
 *          code:
 *           type: 'number'
 *           example: 200
 *          data:
 *           type: 'object'
 *           properties:
 *            suppressionListEnabled:
 *             type: 'string'
 *             example: 'active'
 *            defaultCollaboratorExpirySet:
 *             type: 'string'
 *             example: 'inactive'
 *            defaultAliasHistoryExpirySet:
 *             type: 'string'
 *             example: 'active'
 *            emailAccessTimeFrameSet:
 *             type: 'string'
 *             example: 'active'
 */
router.get(
  '/account-setting-statuses',
  authenticate,
  authorize,
  organizationOperationController.getAccountSettingStatuses
);

export default router;
