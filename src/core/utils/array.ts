/**
 * Check the given parameter is array or not.
 *
 * @param {any} arr
 * @returns {boolean}
 */
export function isArray(arr: any): boolean {
  return arr !== undefined && arr !== null && Array.isArray(arr);
}

/**
 * Sort array with object by number
 *
 * @param arr any
 * @param column string
 * @param direction asc|desc
 */
export function sortObjectByNumber(
  arr: any,
  column: string,
  direction = 'asc'
) {
  return arr.sort((a: any, b: any) => {
    return direction.toLowerCase() == 'asc'
      ? a[column] - b[column]
      : b[column] - a[column];
  });
}
