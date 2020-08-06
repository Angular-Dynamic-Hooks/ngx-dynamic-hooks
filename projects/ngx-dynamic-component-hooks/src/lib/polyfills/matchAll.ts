
/**
 * Polyfill for String.prototype.matchAll() from the ES2020 spec
 *
 * Note: The 'string.prototype.matchall' npm package was unstable for me so providing my own version here
 *
 * @param text - The text to search
 * @param regExp - The RegExp object to use
 */
export function matchAll(text: string, regExp: RegExp): Array<{[index: number]: string, index: number, input: string}> {
  // Must be global
  if (!regExp.global) {
    throw Error('TypeError: matchAll called with a non-global RegExp argument');
  }

  // Clone RegExp object
  const clonedRegExp = new RegExp(regExp.source, regExp.flags);

  // Get matches
  const result = [];
  let match = clonedRegExp.exec(text);
  while (match !== null) {
    result.push(match);
    match = clonedRegExp.exec(text);
  }

  return result;
}
