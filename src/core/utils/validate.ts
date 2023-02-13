import * as Joi from 'joi';

/**
 * Utility helper for Joi validation.
 *
 * @param <T> data
 * @param <Joi.SchemaLike> schema
 * @returns <Promise>
 */
export default async function validate<T>(
  data: T,
  schema: Joi.Schema
): Promise<any> {
  if (schema) {
    return await schema.validate(data, { abortEarly: false });
  }
}
