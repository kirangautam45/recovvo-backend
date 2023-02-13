import fs from 'fs';
import * as _ from 'lodash';
import { Request, Response, NextFunction } from 'express';

import {
  isGmailCredentialValid,
  GOOGLE_CREDENTIAL_FIELDS
} from '../validators/credential';
import lang from '../common/lang';
import logger from '../utils/logger';
import { jsonParse } from '../utils/jsonParse';
import BadRequestError from '../exceptions/BadRequestError';
import { ServiceType } from '../../client/provider/enums/serviceType.enum';

const { errors: errorMessages } = lang;
interface MulterRequest extends Request {
  file: any;
}

const JSON_TYPE = 'application/json';

/**
 * A middleware to validate credential.
 */
export function validateCredential() {
  return async (
    req: MulterRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError(errorMessages.fileNotUploaded);
      }

      if (req.file.mimetype !== JSON_TYPE) {
        fs.unlinkSync(req.file.path);
        throw new BadRequestError(errorMessages.jsonOnly);
      }

      logger.log('info', 'Validating credential file', {
        file: req.file.originalname
      });

      const rawdata = fs.readFileSync(req.file.path);
      const credentials = jsonParse(rawdata.toString());
      if (req.body.service_type == ServiceType.GSUITE) {
        if (!isGmailCredentialValid(credentials)) {
          throw new BadRequestError(errorMessages.invalidCredentials);
        }
        res.locals.credentials = _.pick(credentials, GOOGLE_CREDENTIAL_FIELDS);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
