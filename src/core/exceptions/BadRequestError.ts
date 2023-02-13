import * as HttpStatus from 'http-status-codes';

import Error from './Error';
import DataPayload from '../common/dto/csvErrorData.dto';

/**
 * @class BadRequestError
 * @extends {Error}
 */
class BadRequestError extends Error {
  /**
   * Error message to be thrown.
   *
   * @type {string}
   * @memberof UnauthorizedError
   */
  message: string;
  data: DataPayload[];
  isCSV: boolean;
  /**
   * Creates an instance of BadRequestError.
   *
   * @param {string} message
   * @memberof ForbiddenError
   */
  constructor(message: string, data?: DataPayload[], isCSV?: boolean) {
    super(message, HttpStatus.BAD_REQUEST);

    this.message = message;
    this.data = <DataPayload[]>data;
    this.isCSV = isCSV || false;
  }
}

export default BadRequestError;
