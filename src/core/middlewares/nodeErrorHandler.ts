import lang from '../common/lang';
import logger from '../utils/logger';

const { errors } = lang;

/**
 * Node startup error handler.
 *
 * @param  {NodeJS.ErrnoException} err
 * @returns <void>
 */
export default function nodeErrorHandler(err: NodeJS.ErrnoException): void {
  switch (err.code) {
    case 'EACCES':
      logger.log('error', errors.portRequirePrivilege);
      process.exit(1);

      break;

    case 'EADDRINUSE':
      logger.log('error', errors.portInUse);
      process.exit(1);

      break;

    default:
      throw err;
  }
}
