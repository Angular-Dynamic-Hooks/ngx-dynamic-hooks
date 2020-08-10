import { isDevMode, Injectable } from '@angular/core';
import { HookPosition } from '../interfacesPublic';
import { matchAll } from '../polyfills/matchAll';

/**
 * A utility service to easily parse hooks from a string of text
 */
@Injectable()
export class HookFinder {
  testVar = 'hookfinder active!';

  /**
   * Finds all hooks that are non-enclosing in a string of text, e.g. '<hook>'
   *
   * @param content - The text to search
   * @param hookRegex - The regex to use for the hook
   */
  findStandaloneHooks(content: string, hookRegex: RegExp): Array<HookPosition> {
    const result: Array<HookPosition> = [];

    // Find all hooks
    const openingTagMatches = matchAll(content, hookRegex);

    for (const match of openingTagMatches) {
      result.push({
        openingTagStartIndex: match.index,
        openingTagEndIndex: match.index + match[0].length,
        closingTagStartIndex: null,
        closingTagEndIndex: null,
      });
    }

    return result;
  }

  /**
   * Finds all hooks that are enclosing in a string of text, e.g. '<hook></hook>'
   *
   * Correctly finding enclosing hooks requires a programmatic parser rather then just regex alone, as regex cannot handle
   * patterns that are potentially nested within themselves.
   *
   * - If the content between the opening and closing is lazy (.*?), it would take the first closing tag after the opening tag,
   *   regardless if it belongs to the opening tag or actually a nested hook. This would falsely match the first and third tag
   *   in this example: '<hook><hook></hook></hook>'
   *
   * - If the content between the opening and closing is greedy (.*), it would only end on the last closing tag in the string,
   *   ignoring any previous closing tags. This would falsely match the first and fourth tag in this example:
   *   '<hook></hook><hook></hook>'
   *
   * There is no regex that works for both scenarios. This method therefore manually counts and compares the opening tags with the closing tags.
   *
   * @param content - The text to parse
   * @param openingTagRegex - The regex for the opening tag
   * @param closingTagRegex - The regex for the closing tag
   * @param includeNested - Whether to include nested hooks in the result
   */
  findEnclosingHooks(content: string, openingTagRegex: RegExp, closingTagRegex: RegExp, includeNested: boolean = true): Array<HookPosition> {
    const allTags = [];
    const result: Array<HookPosition> = [];

    // Find all opening tags
    const openingTagMatches = matchAll(content, openingTagRegex);
    for (const match of openingTagMatches) {
      allTags.push({
        isOpening: true,
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    // Find all closing tags
    const closingTagMatches = matchAll(content, closingTagRegex);
    for (const match of closingTagMatches) {
      allTags.push({
        isOpening: false,
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    // Sort by startIndex
    allTags.sort((a, b) => a.startIndex - b.startIndex);

    // Create HookPositions by figuring out which opening tag belongs to which closing tag
    const openedTags = [];
    allTagsLoop: for (const [index, tag] of allTags.entries()) {

      // Any subsequent tag is only allowed to start after previous tag has ended
      if (index > 0 && tag.startIndex < allTags[index - 1].endIndex) {
        if (isDevMode()) {
          console.warn('Syntax error - New tag "' + tag.value + '" started at position ' + tag.starIndex + ' before previous tag "' + allTags[index - 1].value + '" ended at position ' + allTags[index - 1].endIndex + '. Ignoring.');
        }
        continue;
      }

      // Opening or closing tag?
      if (tag.isOpening) {
        openedTags.push(tag);
      } else {
        // Syntax error: Closing tag without preceding opening tag. Syntax error.
        if (openedTags.length === 0) {
          if (isDevMode()) {
            console.warn('Syntax error - Closing tag without preceding opening tag found.');
          }
          continue;
        }

        // If nested hooks not allowed: Skip
        if (!includeNested && openedTags.length > 1) {
          openedTags.pop();
          continue;
        }

        // If nested hooks allowed: Valid hook! Add to result array
        const openingTag = openedTags[openedTags.length - 1];
        result.push({
          openingTagStartIndex: openingTag.startIndex,
          openingTagEndIndex: openingTag.startIndex + openingTag.value.length,
          closingTagStartIndex: tag.startIndex,
          closingTagEndIndex: tag.startIndex + tag.value.length
        });
        openedTags.pop();
      }
    }

    if (openedTags.length > 0) {
      if (isDevMode()) {
        console.warn('Syntax error - Opening tags without corresponding closing tags found.');
      }
    }

    return result;
  }
}
