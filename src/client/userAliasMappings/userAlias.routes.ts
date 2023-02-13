import { Router } from 'express';

import { ROUTES } from '../../client/user/user.constants';
import authenticate from '../../core/middlewares/authenticate';
import authorizeAliasEmailView from '../user/middlewares/authorizeAlias';
import { requestQueryValidator } from '../../core/middlewares/validateRequestQuery';
import * as providerUserThread from '../providerUserThread/providerUserThread.controller';
import { fetchEmailThreadsRequestQuerySchema } from '../providerUserThread/validators/requestQuery.validator';

const router: Router = Router();

/**
 * @swagger
 * /tenant/{tenantId}/aliases/{id}/emails:
 *  get:
 *    tags:
 *      [Alias_Email_Access]
 *    security:
 *       - BearerAuth: []
 *    description: 'Fetch email threads of a user where logged in user is an alias of user'
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
 *         name: hasAttachments
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
  ROUTES.FETCH_ALIAS_EMAILS,
  authenticate,
  authorizeAliasEmailView,
  requestQueryValidator(fetchEmailThreadsRequestQuerySchema),
  providerUserThread.fetchAliasEmails
);

export default router;
