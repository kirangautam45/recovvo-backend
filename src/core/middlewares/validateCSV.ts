import { Request, Response, NextFunction } from 'express';

import fs from 'fs';
import lang from '../common/lang';
import logger from '../utils/logger';
import { readCSV, validateFileFormat } from '../utils/csv';
import validate from '../utils/validateCSV';
import BadRequestError from '../exceptions/BadRequestError';

const { errors: errorMessages } = lang;
interface MulterRequest extends Request {
  file: any;
}

const CSV_TYPES = [
  'application/vnd.ms-excel',
  'text/plain',
  'text/csv',
  'text/tsv'
];

/**
 * A middleware to validate schema.
 *
 * @param {String[]} params
 */
export function validateCSV(params: string[]) {
  return async (
    req: MulterRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError(errorMessages.fileNotUploaded);
      }

      if (!validateFileFormat(req.file.originalname)) {
        fs.unlinkSync(req.file.path);
        throw new BadRequestError(errorMessages.csvOnly);
      }

      if (!CSV_TYPES.includes(req.file.mimetype)) {
        fs.unlinkSync(req.file.path);
        throw new BadRequestError(errorMessages.csvOnly);
      }

      logger.log('info', 'Validating csv headers', {
        file: req.file.originalname
      });
      const { headers, results, errors } = await readCSV(req.file.path);

      const headerErrors = await validate(headers, params);

      if (results.length === 0) {
        throw new BadRequestError(errorMessages.csvFileCannotBeEmpty);
      }

      if (errors.length) {
        if (
          !(
            headers.length === 1 &&
            errors.length === 1 &&
            errors[0].code === 'UndetectableDelimiter'
          )
        ) {
          throw new BadRequestError(errorMessages.csvFileInvalid);
        }
      }

      if (headerErrors.length) {
        throw new BadRequestError(errorMessages.csvError, headerErrors, true);
      }

      res.locals.csvResults = results;
      next();
    } catch (err) {
      next(err);
    }
  };
}
