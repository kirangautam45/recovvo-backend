import * as HttpStatus from 'http-status-codes';

import Error from './Error';

/**
 * @class ServerError
 * @extends {Error}
 */
class ServerError extends Error {
  /**
   * Error message to be thrown.
   *
   * @type {string}
   * @memberof ServerError
   */
  message: string;

  /**
   * Creates an instance of ServerError.
   *
   * @param {string} message
   * @memberof ServerError
   */
  constructor(message: string) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);

    this.message = message;
  }
}

export default ServerError;
