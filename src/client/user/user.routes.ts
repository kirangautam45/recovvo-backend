import Multer from 'multer';
import { Router } from 'express';

import { ROUTES } from './user.constants';
import * as userController from './user.controller';
import authorize from '../../core/middlewares/authorize';
import { schema } from '../../core/middlewares/validate';
import { csvValidators } from './validators/csv.validator';
import { userValidator } from './validators/user.validator';
import authenticate from '../../core/middlewares/authenticate';
import { updateValidator } from './validators/update.validator';
import { validateCSV } from '../../core/middlewares/validateCSV';
import authorizeSupervisor from './middlewares/authorizeSupervisor';
import * as userAliasController from '../userAliasMappings/userAlias.controller';
import { clientDomainCsvValidators } from '../clientDomain/validators/csv.validator';
import { fetchEmailThreadsRequestQuerySchema } from '../providerUserThread/validators/requestQuery.validator';
import {
  aliasMappingValidators,
  bulkAliasMappingValidators
} from './../userAliasMappings/validators/csv.validator';
import {
  addSupervisorValidator,
  removeSupervisorValidator
} from './validators/supervisor.validator';
import {
  addAliasValidator,
  removeAliasValidator,
  removeAllAliasValidator,
  updateAliasAccessValidator
} from './validators/userAlias.validator';
import {
  domainUserMapValidator,
  domainUserUnmapValidator
} from './validators/domainUserMap.validator';
import {
  addOrUpdateCollaboratorsValidator,
  removeCollaboratorValidator
} from '../userCollaboratorMapping/validators/collaborator.validator';
import { requestQueryValidator } from '../../core/middlewares/validateRequestQuery';
import * as providerUserThread from '../providerUserThread/providerUserThread.controller';
import { authorizeAliasEmailActivityView } from '../../client/user/middlewares/authorizeAlias';
import * as userCollaboratorMapping from '../userCollaboratorMapping/userCollaboratorMapping.controllers';
import { userCollaboratorMappingCsvValidator } from '../userCollaboratorMapping/validators/collaboratorMappingCsv.validator';
import { userCollaboratorBulkMappingCsvValidator } from '../userCollaboratorMapping/validators/collaboratorMappingCsv.validator';

const router: Router = Router();
const upload = Multer({ dest: 'tmp/csv/' });

router.post(
  '/upload-csv',
  authenticate,
  authorize,
  upload.single('file'),
  validateCSV(csvValidators),
  userController.uploadCSV
);

router.get(
  '/supervisors/download-csv',
  authenticate,
  authorize,
  userController.downloadUserSupervisorCSV
);

router.get(
  '/client-domains/download-csv',
  authenticate,
  authorize,
  userController.downloadUserClientDomainCSV
);

router.get('/download-csv-template', userController.downloadTemplate);

/**
 * @swagger
 * /tenant/{tenantId}/users/download-collaborator-csv:
 *  get:
 *    tags:
 *      [Collaborator_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Download user collaborator mappings csv file'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    responses:
 *     200:
 *      description: Collaborator mapping csv download successful .
 */
router.get(
  ROUTES.DOWNLOAD_COLLABORATOR_MAPPINGS,
  authenticate,
  authorize,
  userCollaboratorMapping.downloadUserCollaboratorCSV
);

router.post(
  '/validate',
  authenticate,
  authorize,
  schema(userValidator),
  userController.validateUsers
);

router.post(
  '/validate',
  authenticate,
  authorize,
  schema(userValidator),
  userController.validateUsers
);

router.post('/verify-email-invitation', userController.verifyEmailInvitation);
router.get(
  '/download-csv-template',
  authenticate,
  userController.downloadTemplate
);

router.post(
  '/',
  authenticate,
  authorize,
  schema(userValidator),
  userController.upload
);
router.get('/', authenticate, userController.fetchAll);
router.get(
  '/suggest',
  authenticate,
  authorize,
  userController.fetchUserSuggestionByQuery
);
router.get('/profile', authenticate, userController.fetchUserProfile);

router.post(
  '/:id/resend-invitation',
  authenticate,
  authorize,
  userController.resendInvitationToUser
);

/**
 * @swagger
 * /tenant/{tenantId}/users/personal-contact-search-params:
 *  get:
 *    tags:
 *      [User]
 *    security:
 *       - BearerAuth: []
 *    description: 'Gets the list of search parameter for the loggedIn user'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - in: query
 *         name: 'search'
 *         description: 'Filters the data'
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: object
 *           properties:
 *              subordinateCount:
 *                type: number
 *              subordinates:
 *                type: array
 *                items:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: number
 *                    email:
 *                      type: string
 *                    fullName:
 *                      type: string
 *              collaboratorCount:
 *                type: number
 *              collaborators:
 *                type: array
 *                items:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: number
 *                    email:
 *                      type: string
 *                    fullName:
 *                      type: string
 *              aliasCount:
 *                type: number
 *              aliases:
 *                type: array
 *                items:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: number
 *                    email:
 *                      type: string
 *                    fullName:
 *                      type: string *
 */
router.get(
  ROUTES.PERSONAL_CONTACT_SEARCH_PARAMS,
  authenticate,
  userController.getPersonalContactSearchParams
);

// User Routes starting with /:id
router.get('/:id', authenticate, userController.findAppUserById);

router.patch(
  '/:id',
  authenticate,
  authorize,
  schema(updateValidator),
  userController.updateUserInformation
);

router.post(
  '/:id/resend-invitation',
  authenticate,
  authorize,
  userController.resendInvitationToUser
);

/** Client Domain Routes */
router.post(
  '/:id/upload-domain-mapping',
  authenticate,
  authorize,
  upload.single('file'),
  validateCSV(clientDomainCsvValidators),
  userController.uploadSpecificClientDomainUser
);

router.post(
  '/:id/add-domain-mapping',
  authenticate,
  authorize,
  schema(domainUserMapValidator),
  userController.manualUploadUserClientDomains
);
router.post(
  '/:id/remove-domain-mapping',
  authenticate,
  authorize,
  schema(domainUserUnmapValidator),
  userController.removeClientDomainUserMapping
);
router.get(
  '/:id/client-domains',
  authenticate,
  userController.fetchMappedDomains
);

/** Supervisor Routes  */
router.post(
  '/:id/validate-supervisor',
  authenticate,
  authorize,
  schema(userValidator),
  userController.validateSupervisor
);
router.get(
  '/:id/possible-supervisor-list',
  authenticate,
  authorize,
  userController.fetchPossibleSupervisors
);
router.get(
  '/:id/recommended-supervisor-list',
  authenticate,
  authorize,
  userController.fetchRecommendedSupervisors
);
router.get('/:id/supervisors', authenticate, userController.fetchSupervisors);

router.post(
  '/:id/add-supervisors',
  authenticate,
  authorize,
  schema(addSupervisorValidator),
  userController.addSupervisors
);

router.post(
  '/:id/remove-supervisor',
  authenticate,
  authorize,
  schema(removeSupervisorValidator),
  userController.removeSupervisor
);

/** Collaborator Mapping Routes  */

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/collaborators:
 *  get:
 *    tags:
 *      [Collaborator_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Gets the list of collaborators mapped to the user'
 *    parameters:
 *       - in: query
 *         name: searchParam
 *         schema:
 *          type: string
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: array
 *           items:
 *              $ref: '#/components/schemas/UserCollaboratorMapping'
 */
router.get(
  ROUTES.FETCH_COLLABORATORS,
  authenticate,
  userCollaboratorMapping.fetchCollaborators
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/add-collaborators:
 *  post:
 *    tags:
 *      [Collaborator_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Add collaborators mappings to the user'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    requestBody:
 *      description: Json object containing collborator emails
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              collaboratorEmails:
 *                type: array
 *                items:
 *                  type: string
 *              isCustomAccessDurationSet:
 *                type: boolean
 *              accessStartDate:
 *                type: date
 *              accessEndDate:
 *                type: date
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: object
 *           properties:
 *              success:
 *                type: array
 *                items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     status:
 *                       type: number
 *                     message:
 *                       type: string
 *              failure:
 *                type: array
 *                items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     status:
 *                       type: number
 *                     message:
 *                       type: string
 *          meta:
 *           type: object
 *           properties:
 *              total:
 *                type: number
 *              error:
 *                type: number
 *              mapped:
 *                type: number
 *     400:
 *      description: Bad request
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          message:
 *           type: string
 */
router.post(
  ROUTES.ADD_COLLABORATORS,
  authenticate,
  authorize,
  schema(addOrUpdateCollaboratorsValidator),
  userCollaboratorMapping.addCollaborators
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/validate-collaborator:
 *  post:
 *    tags:
 *      [Collaborator_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Validate collaborator of different emails'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    requestBody:
 *      description: Json object containing collaborator emails
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              emails:
 *                type: array
 *                items:
 *                  type: string
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          data:
 *           type: array
 *           items:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                status:
 *                  type: number
 *                message:
 *                  type: string
 */
router.post(
  '/:id/validate-collaborator',
  authenticate,
  authorize,
  schema(userValidator),
  userCollaboratorMapping.validateCollaborator
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/remove-collaborator:
 *  post:
 *    tags:
 *      [Collaborator_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Remove collaborator mapping of the user'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    requestBody:
 *      description: Json object containing collborator emails
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              collaboratorEmail:
 *                type: string
 *    responses:
 *     204:
 *      description: The resource was deleted successfully.
 *     400:
 *      description: Bad request
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          message:
 *           type: string
 */
router.post(
  ROUTES.REMOVE_COLLABORATOR,
  authenticate,
  authorize,
  schema(removeCollaboratorValidator),
  userCollaboratorMapping.removeCollaborator
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/remove-all-collaborators:
 *  get:
 *    tags:
 *      [Collaborator_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Remove all collaborator mappings of the user with given userID'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    responses:
 *     200:
 *      description: The resource was deleted successfully.
 */
router.get(
  ROUTES.REMOVE_ALL_COLLABORATORS,
  authenticate,
  authorize,
  userCollaboratorMapping.removeAllCollaborators
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/update-collaborators:
 *  put:
 *    tags:
 *      [Collaborator_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Update collaborators that are mapped to the user'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    requestBody:
 *      description: Json object containing collborator emails
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              collaboratorEmails:
 *                type: array
 *                items:
 *                  type: string
 *              isCustomAccessDurationSet:
 *                type: boolean
 *              accessStartDate:
 *                type: date
 *              accessEndDate:
 *                type: date
 *    responses:
 *     200:
 *      description: Collaborators succesfully updated.
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: array
 *           items:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                fullName:
 *                  type: string
 *                status:
 *                  type: number
 *                message:
 *                  type: string
 *     400:
 *      description: Bad request
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          message:
 *           type: string
 */
router.put(
  ROUTES.UPDATE_COLLABORATORS,
  authenticate,
  authorize,
  schema(addOrUpdateCollaboratorsValidator),
  userCollaboratorMapping.updateCollaborators
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/possible-collaborator-list:
 *  get:
 *    tags:
 *      [Collaborator_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Gets the list of possible collaborators'
 *    parameters:
 *       - in: query
 *         name: search
 *         schema:
 *          type: string
 *       - in: query
 *         name: max
 *         schema:
 *          type: string
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: array
 *           items:
 *              type: object
 *              properties:
 *                fullName:
 *                  type: string
 *                email:
 *                  type: string
 *                id:
 *                  type: number
 */
router.get(
  ROUTES.POSSIBLE_COLLABORATOR_LIST,
  authenticate,
  authorize,
  userCollaboratorMapping.fetchPossibleCollaborators
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/upload-collaborator-csv:
 *  post:
 *    tags:
 *      [Collaborator_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Upload user collaborator mappings using csv file'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of user'
 *    requestBody:
 *      description: CSV file containing CollaboratorEmail,AccessStartDate(MM-DD-YYYY),AccessEndDate(MM-DD-YYYY) as header
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              file:
 *                type: string
 *                format: binary
 *    responses:
 *     200:
 *      description: Collaborator mapping csv upload.
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: array
 *           items:
 *            type: object
 *            properties:
 *              csvRow:
 *                type: number
 *              email:
 *                type: string
 *              status:
 *                type: number
 *              message:
 *                type: string
 */
router.post(
  ROUTES.UPLOAD_USER_COLLABORATOR_MAPPING,
  authenticate,
  authorize,
  upload.single('file'),
  validateCSV(userCollaboratorMappingCsvValidator),
  userCollaboratorMapping.uploadCollaboratorsMappingCsv
);

/**
 * @swagger
 * /tenant/{tenantId}/users/upload-collaborator-csv:
 *  post:
 *    tags:
 *      [Collaborator_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Upload bulk user collaborator mappings using csv file'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    requestBody:
 *      description: CSV file containing UserEmail,CollaboratorEmail,AccessStartDate(MM-DD-YYYY), AccessEndDate(MM-DD-YYYY) as header
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              file:
 *                type: string
 *                format: binary
 *    responses:
 *     200:
 *      description: Collaborator mapping csv upload.
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: array
 *           items:
 *            type: object
 *            properties:
 *              csvRow:
 *                type: number
 *              userEmail:
 *                type: string
 *              collaboratorEmail:
 *                type: string
 *              status:
 *                type: number
 *              message:
 *                type: string
 */
router.post(
  ROUTES.UPLOAD_BULK_USER_COLLABORATOR_MAPPING,
  authenticate,
  authorize,
  upload.single('file'),
  validateCSV(userCollaboratorBulkMappingCsvValidator),
  userCollaboratorMapping.uploadBulkUsersCollaboratorsMappingCsv
);

/** Alias Routes  */

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/validate-alias:
 *  post:
 *    tags:
 *      [Alias_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Validate alias of differen email'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    requestBody:
 *      description: Json object containing alias emails
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              emails:
 *                type: array
 *                items:
 *                  type: string
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          data:
 *           type: array
 *           items:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                status:
 *                  type: number
 *                message:
 *                  type: string
 */
router.post(
  '/:id/validate-alias',
  authenticate,
  authorize,
  schema(userValidator),
  userAliasController.validateAlias
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/possible-alias-list:
 *  get:
 *    tags:
 *      [Alias_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Gets the list of possible alias'
 *    parameters:
 *       - in: query
 *         name: search
 *         schema:
 *          type: string
 *       - in: query
 *         name: max
 *         schema:
 *          type: string
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: array
 *           items:
 *              type: object
 *              properties:
 *                id:
 *                  type: number
 *                email:
 *                  type: string
 *                fullName:
 *                  type: string
 */
router.get(
  '/:id/possible-alias-list',
  authenticate,
  authorize,
  userAliasController.fetchPossibleAliases
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/aliases:
 *  get:
 *    tags:
 *      [Alias_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Gets the list of aliases mapped to the user'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: array
 *           items:
 *              type: object
 *              properties:
 *                userId:
 *                  type: number
 *                aliasUserId:
 *                  type: number
 *                isCustomAccessDurationSet:
 *                  type: boolean
 *                aliasStartDate:
 *                  type: string
 *                aliasEndDate:
 *                  type: string
 *                historicalEmailAccessStartDate:
 *                  type: string
 *                historicalEmailAccessEndDate:
 *                  type: string
 *                email:
 *                  type: string
 *                fullName:
 *                  type: string
 */
router.get('/:id/aliases', authenticate, userAliasController.fetchAliases);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/add-aliases:
 *  post:
 *    tags:
 *      [Alias_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Add aliases mappings to the user'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    requestBody:
 *      description: Json object containing alias emails, alias and access dates
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              aliasEmails:
 *                type: array
 *                items:
 *                  type: string
 *              isCustomAccessDurationSet:
 *                type: boolean
 *              aliasStartDate:
 *                type: string
 *              aliasEndDate:
 *                type: string
 *              historicalEmailAccessStartDate:
 *                type: string
 *              historicalEmailAccessEndDate:
 *                type: string
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: object
 *           properties:
 *              success:
 *                type: array
 *                items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     status:
 *                       type: number
 *                     message:
 *                       type: string
 *              failure:
 *                type: array
 *                items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     status:
 *                       type: number
 *                     message:
 *                       type: string
 *          meta:
 *           type: object
 *           properties:
 *              total:
 *                type: number
 *              error:
 *                type: number
 *              mapped:
 *                type: number
 */
router.post(
  '/:id/add-aliases',
  authenticate,
  authorize,
  schema(addAliasValidator),
  userAliasController.addAliases
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/remove-alias:
 *  post:
 *    tags:
 *      [Alias_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Remove alias mapping of the user'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    requestBody:
 *      description: Json object containing alias email
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              aliasEmail:
 *                type: string
 *    responses:
 *     204:
 *      description: The resource was deleted successfully.
 *     400:
 *      description: Bad request
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          message:
 *           type: string
 */
router.post(
  '/:id/remove-alias',
  authenticate,
  authorize,
  schema(removeAliasValidator),
  userAliasController.removeAlias
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/remove-bulk-alias:
 *  post:
 *    tags:
 *      [Alias_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Remove alias mapping of the user'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    requestBody:
 *      description: Json object containing alias email; can be an array of emails
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          aliasEmails:
 *           type: 'array'
 *           items:
 *            type: 'string'
 *        example:
 *         aliasEmails: ["mail1@domain.com", "mail2@domain2.com"]
 *    responses:
 *     200:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: object
 *           properties:
 *              success:
 *                type: array
 *                items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     status:
 *                       type: number
 *              failure:
 *                type: array
 *                items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     status:
 *                       type: number
 */
router.post(
  ROUTES.REMOVE_BULK_ALIAS,
  authenticate,
  authorize,
  schema(removeAllAliasValidator),
  userAliasController.removeBulkAlias
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/remove-all-alias:
 *  get:
 *    tags:
 *      [Alias_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Remove alias mapping of the user'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    responses:
 *     200:
 *      description: The resource was deleted successfully.
 */
router.get(
  ROUTES.REMOVE_ALL_ALIAS,
  authenticate,
  authorize,
  userAliasController.removeAllAlias
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/update-alias-access:
 *  put:
 *    tags:
 *      [Alias_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Update Alias Access Date of the user'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    requestBody:
 *      description: Json object containing collborator email, access dates
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              aliasEmail:
 *                type: string
 *              isCustomAccessDurationSet:
 *                type: boolean
 *              aliasStartDate:
 *                type: string
 *              aliasEndDate:
 *                type: string
 *              historicalEmailAccessStartDate:
 *                type: string
 *              historicalEmailAccessEndDate:
 *                type: string
 *    responses:
 *     200:
 *      description: The resource was deleted successfully.
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: array
 *           items:
 *              type: object
 *              properties:
 *                userId:
 *                  type: number
 *                aliasUserId:
 *                  type: number
 *                aliasStartDate:
 *                  type: string
 *                isCustomAccessDurationSet:
 *                  type: boolean
 *                aliasEndDate:
 *                  type: string
 *                historicalEmailAccessStartDate:
 *                  type: string
 *                historicalEmailAccessEndDate:
 *                  type: string
 *                isDeleted:
 *                  type: boolean
 *                createdAt:
 *                  type: string
 *                updatedAt:
 *                  type: string
 *     400:
 *      description: Bad request
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          message:
 *           type: string
 */
router.put(
  '/:id/update-alias-access',
  authenticate,
  authorize,
  schema(updateAliasAccessValidator),
  userAliasController.updateAliasAccess
);

/**
 * @swagger
 * /tenant/{tenantId}/users/aliases/download-csv:
 *  get:
 *    tags:
 *      [Alias_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Download user alias mappings csv file'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    responses:
 *     200:
 *      description: Alias mapping csv download successful .
 */
router.get(
  '/aliases/download-csv',
  authenticate,
  authorize,
  userAliasController.downloadUserAliasCSV
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/upload-alias-mapping:
 *  post:
 *    tags:
 *      [Alias_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Upload Alias Csv for mapping'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              file:
 *                type: string
 *                format: binary
 *    responses:
 *     200:
 *      description: Alias mapping csv upload.
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: array
 *           items:
 *            type: object
 *            properties:
 *             csvRow:
 *              type: number
 *              example: 1
 *             email:
 *              type: string
 *             status:
 *              type: number
 *              example: 201
 *             message:
 *              type: string
 *              example: success
 */
router.post(
  ROUTES.UPLOAD_ALIAS_MAPPING,
  authenticate,
  authorize,
  upload.single('file'),
  validateCSV(aliasMappingValidators),
  userAliasController.uploadAliasMappingCsv
);

/**
 * @swagger
 * /tenant/{tenantId}/users/upload-alias-mapping:
 *  post:
 *    tags:
 *      [Alias_Mapping]
 *    security:
 *       - BearerAuth: []
 *    description: 'Upload bulk Alias Csv for mapping with users'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *    requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              file:
 *                type: string
 *                format: binary
 *    responses:
 *     200:
 *      description: Alias mapping csv upload.
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: array
 *           items:
 *              type: object
 *              properties:
 *               csvRow:
 *                type: number
 *               userEmail:
 *                type: string
 *               aliasEmail:
 *                type: string
 *               status:
 *                type: number
 *                example: 400
 *               message:
 *                type: string
 */
router.post(
  ROUTES.UPLOAD_BULK_ALIAS_MAPPING,
  authenticate,
  authorize,
  upload.single('file'),
  validateCSV(bulkAliasMappingValidators),
  userAliasController.uploadBulkUsersAliasMappingCsv
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{id}/emails:
 *  get:
 *    tags:
 *      [Supervisor_Email_Access]
 *    security:
 *       - BearerAuth: []
 *    description: 'Fetch email threads of a user where logged in user is supervisor of that user'
 *    parameters:
 *       - in: query
 *         name: page
 *         schema:
 *          type: number
 *       - in: query
 *         name: pageSize
 *         schema:
 *          type: number
 *       - in: query
 *         name: search
 *         schema:
 *          type: string
 *       - in: query
 *         name: hasAttachment
 *         schema:
 *          type: boolean
 *       - in: query
 *         name: emailFrom
 *         schema:
 *          type: string
 *       - in: query
 *         name: emailUpto
 *         schema:
 *          type: string
 *       - in: query
 *         name: sortField
 *         schema:
 *          type: string
 *       - in: query
 *         name: sortDirection
 *         schema:
 *          type: string
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'id'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    responses:
 *     200:
 *      description: GET request successfull.
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: object
 *           properties:
 *            id:
 *              type: string
 *            firstName:
 *              type: string
 *            lastName:
 *              type: string
 *            email:
 *              type: array
 *              items:
 *                type: string
 *            data:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Email'
 *            total:
 *              type: string
 *            hasNextPage:
 *              type: boolean
 *            page:
 *              type: number
 *            pageSize:
 *              type: number
 *     403:
 *      description: Forbidden
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          message:
 *           type: string
 */
router.get(
  '/:userId/emails',
  authenticate,
  requestQueryValidator(fetchEmailThreadsRequestQuerySchema),
  authorizeSupervisor,
  providerUserThread.fetchUserEmails
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/emails/{id}/activities:
 *  get:
 *    tags:
 *      [Supervisor_Email_Access]
 *    security:
 *       - BearerAuth: []
 *    description: 'Fetch email activities of an email of a user where logged in user is supervisor of that user'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *       - name: 'id'
 *         in: 'path'
 *         required: true
 *         description: 'Id of email thread'
 *    responses:
 *     200:
 *      description: GET request successfull.
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          data:
 *           type: object
 *           properties:
 *            id:
 *              type: string
 *            subject:
 *              type: string
 *            from:
 *              type: string
 *            to:
 *              type: array
 *              items:
 *                type: string
 *            cc:
 *              type: array
 *              items:
 *                type: string
 *            bcc:
 *              type: array
 *              items:
 *                type: string
 *            data:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: number
 *                  fullName:
 *                    type: string
 *                  email:
 *                    type: string
 *                  subject:
 *                    type: string
 *                  messageDatetime:
 *                    type: string
 *                  isSupressed:
 *                    type: boolean
 *                  bodyData:
 *                    type: string
 *                  attachments:
 *                    type: array
 *                    items:
 *                      type: string
 *     403:
 *      description: Forbidden
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          message:
 *           type: string
 */
router.get(
  '/:userId/emails/:id/activities',
  authenticate,
  authorizeSupervisor,
  providerUserThread.fetchEmailActivities
);

router.get(
  '/alias/:userId/emails/:id/activities',
  authenticate,
  authorizeAliasEmailActivityView,
  providerUserThread.fetchEmailActivities
);

/**
 * @swagger
 * /tenant/{tenantId}/users/{userId}/emailsCount:
 *  get:
 *    tags:
 *      [Supervisor_Email_Access]
 *    security:
 *       - BearerAuth: []
 *    description: 'Fetch emailsCount of a subordinate'
 *    parameters:
 *       - name: 'tenantId'
 *         in: 'path'
 *         required: true
 *         description: 'ID of tenant'
 *       - name: 'userId'
 *         in: 'path'
 *         required: true
 *         description: 'Id of user'
 *    responses:
 *     200:
 *      description: GET request successfull.
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          emailsCount:
 *           type: number
 *     403:
 *      description: Forbidden
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          code:
 *           type: number
 *          message:
 *           type: string
 */
router.get(
  ROUTES.FETCH_SUBORDINATE_EMAILS_COUNT,
  authenticate,
  authorizeSupervisor,
  providerUserThread.fetchEmailsCount
);

export default router;
