import { isDevMode, Injectable } from '@angular/core';

import { HookPosition } from '../../../interfacesPublic';
import { regexes } from '../../../utils/regexes';
import { HookFinder } from '../../../utils/hookFinder';


/**
 * Functions for finding, parsing and analyzing generic hooks
 */
@Injectable()
export class GenericSelectorFinder {

  constructor(private hookFinder: HookFinder) {
  }

  findSingleTagSelectors(dynamicText: string, selector: string, bracketStyle: {opening: string, closing: string} = {opening: '<', closing: '>'}): Array<HookPosition> {
    // Create opening tag regex
    const openingTagRegex = this.generateOpeningTagRegex(selector, bracketStyle);

    return this.hookFinder.findStandaloneHooks(dynamicText, openingTagRegex);
  }

  findMultiTagSelectors(dynamicText: string, selector: string, bracketStyle: {opening: string, closing: string} = {opening: '<', closing: '>'}, includeNested: boolean = true): Array<HookPosition> {
    // Create opening and closing tag regex
    const openingTagRegex = this.generateOpeningTagRegex(selector, bracketStyle);
    const closingTagRegex =  this.generateClosingTagRegex(selector, bracketStyle);

    return this.hookFinder.findEnclosingHooks(dynamicText, openingTagRegex, closingTagRegex, includeNested);
  }

  // Hook regex helper
  // ----------------------------------------------------------------------------------------------------------------------------------------

  /**
   * Generates the opening tag regex for a standard hook
   * @param selector - The selector of the hook
   */
  private generateOpeningTagRegex(selector: string, bracketStyle: {opening: string, closing: string} = {opening: '<', closing: '>'}) {
    // Find opening tag of hook lazily
    // Examples for this regex: https://regex101.com/r/17x3cc/13
    // Features: Ignores redundant whitespace & line-breaks, supports n attributes, both normal and []-attribute-name-syntax, both ' and " as attribute-value delimiters
    const openingArrow = this.escapeRegex(bracketStyle.opening);
    const selectorName = this.escapeRegex(selector);
    const closingArrow = this.escapeRegex(bracketStyle.closing);
    const space = '\\s';

    const attributeValuesOR = '(?:' + regexes.attributeValueDoubleQuotesRegex + '|' + regexes.attributeValueSingleQuotesRegex + ')';
    const attributes = '(?:' + space + '+' + regexes.attributeNameRegex + '\=' + attributeValuesOR + ')+';

    const fullRegex = openingArrow + selectorName + '(?:' + space + '*' + closingArrow + '|' + attributes + space + '*' + closingArrow + ')';

    const regexObject = new RegExp(fullRegex, 'gims');

    return regexObject;
  }

  /**
   * Generates the opening tag regex for a standard hook
   * @param selector - The selector of the hook
   */
  private generateClosingTagRegex(selector: string, bracketStyle: {opening: string, closing: string} = {opening: '<', closing: '>'}) {
    const openingArrow = this.escapeRegex(bracketStyle.opening) + '\/';
    const selectorName = this.escapeRegex(selector);
    const closingArrow = this.escapeRegex(bracketStyle.closing);

    const fullRegex = openingArrow + selectorName + closingArrow;

    const regexObject = new RegExp(fullRegex, 'gims');

    return regexObject;
  }

  /**
   * Safely escapes a string for use in regex
   * @param text - The string to escape
   */
  escapeRegex(text: string) {
    return text.replace(new RegExp('[-\\/\\\\^$*+?.()|[\\]{}]', 'g'), '\\$&');
  }

}
