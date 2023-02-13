import { isObject } from './object';

/**
 * Build csv structure.
 *
 * @param headers
 * @param response
 */
export function buildCSVStructure(headers: any, response: any) {
  return response.reduce(
    (acc: any[], val: any) => {
      return [...acc, setCsvValues(headers, val)];
    },
    [setCsvHeaders(headers)]
  );
}

/**
 * Set object to array of values for csv.
 *
 * @param headers
 * @param data
 */
function setCsvValues(headers: any, data: any): any {
  return Object.keys(headers).reduce((acc: any[], val) => {
    return isObject(headers[val])
      ? acc.concat(setCsvValues(headers[val], data[val]))
      : [...acc, data[val]];
  }, []);
}

/**
 * Set object to array of header for csv.
 *
 * @param headers
 */
function setCsvHeaders(headers: any): any {
  return Object.values(headers).reduce((acc: any[], val) => {
    return isObject(val) ? acc.concat(setCsvHeaders(val)) : [...acc, val];
  }, []);
}
