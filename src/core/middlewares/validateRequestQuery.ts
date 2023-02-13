import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

import logger from '../utils/logger';
import validate from '../utils/validate';

/**
 * A middleware to validate schema.
 *
 * @param {Joi.Schema} schema
 */
export function requestQueryValidator(schema: Joi.Schema) {
  return async (
    req: Request,
    _: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.log('info', 'Validating request query');

      await validate(req.query, schema);

      next();
    } catch (err) {
      next(err);
    }
  };
}
