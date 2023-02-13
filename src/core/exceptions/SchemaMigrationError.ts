import { constructSchemaNameRequired } from '../../core/utils/errorMessage';

/**
 * @class SchemaMigrationError
 * @extends {Error}
 */
class SchemaMigrationError extends Error {
  /**
   * Error message to be thrown.
   *
   * @type {string}
   */
  message: string;

  /**
   * Creates an instance of SchemaMigrationError.
   *
   * @param {string} message
   */
  constructor(message: string = constructSchemaNameRequired()) {
    super(message);

    this.message = message;
  }
}

export default SchemaMigrationError;
