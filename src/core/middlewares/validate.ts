import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

import logger from '../utils/logger';
import validate from '../utils/validate';

/**
 * A middleware to validate schema.
 *
 * @param {Joi.Schema} params
 */
export function schema(params: Joi.Schema) {
  return async (
    req: Request,
    _: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.log('info', 'Validating schema');

      const { error } = await validate(req.body, params);

      error ? next(error) : next();
    } catch (err) {
      next(err);
    }
  };
}
