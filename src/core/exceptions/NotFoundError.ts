import * as HttpStatus from 'http-status-codes';

import Error from './Error';

/**
 * @class NotFound
 * @extends {Error}
 */
class NotFound extends Error {
  /**
   * Error message to be thrown.
   *
   * @type {string}
   * @memberof UnauthorizedError
   */
  message: string;

  /**
   * Creates an instance of NotFound.
   *
   * @param {string} message
   * @memberof NotFound
   */
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND);

    this.message = message;
  }
}

export default NotFound;
