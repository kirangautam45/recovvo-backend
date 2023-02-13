/**
 * Check the given parameter is string or not.
 *
 * @param {any} text
 * @returns {boolean}
 */
export function isString(text: any): boolean {
  return typeof text === 'string';
}

/**
 * booleans in json may be being passed as string,
 * so convert back to recognizable boolean
 *
 * @param {string} str
 */
export function boolify(str: string | boolean) {
  if (str === 'true' || str === true) {
    return true;
  }
  return false;
}

/**
 * Split string into array removing whitespace and empty string array
 */
export function splitWithFilter(text: string) {
  if (text == null) return [];
  return text
    .split(' ')
    .join('')
    .split(',')
    .filter((val: any) => val);
}

/**
 * Concat string with filter.
 * @param data
 */
export function concatWithFilter(data: string[]) {
  return data.filter((text) => !!text).join(' ') || null;
}

/**
 * Capitalize the first letter of given word.
 *
 * @param {string} word
 * @returns string
 */
export function capitalize(word: string): string {
  return `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`;
}

/**
 * Camel case given word or sentence, separator replaces to capital letters.
 * E.g. example_text => exampleText.
 *
 * @param {string} text
 * @param {string} [separator='_']
 * @returns string
 */
export function camelcase(text: string, separator = '_'): string {
  if (!isString(text)) {
    return text;
  }

  const words = text.split(separator);

  return [
    words[0],
    ...words
      .slice(1)
      .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
  ].join('');
}

/**
Checks whether a string is empty or not.
@example
isEmpty('') return true
*/
export const isEmpty = (str: string): boolean => {
  if (!str) return true;

  return str.trim() === '';
};
