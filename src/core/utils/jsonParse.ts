import logger from '../utils/logger';

/**
 * Json parse. If fail return empty object.
 *
 * @param {string} json string
 * @returns object
 */
export function jsonParse(content: string): any {
  try {
    return JSON.parse(content);
  } catch (err) {
    logger.log('error', 'Invalid JSON format.', err);
    return {};
  }
}
