import { Injectable } from '@angular/core';

import { HookPosition } from '../../../interfacesPublic';
import { regexes } from '../../../utils/regexes';
import { HookFinder } from '../../../utils/hookFinder';


/**
 * A service for SelectorHookParser, responsible for finding Angular component selectors in the content
 */
@Injectable()
export class SelectorHookFinder {

  constructor(private hookFinder: HookFinder) {
  }

  /**
   * Finds standalone Angular component selectors
   *
   * @param content - The content to parse
   * @param selector - The Angular selector to find
   * @param bracketStyle - What bracket style to use
   */
  findStandaloneSelectors(content: string, selector: string, bracketStyle: {opening: string, closing: string} = {opening: '<', closing: '>'}): Array<HookPosition> {
    // Create opening tag regex
    const openingTagRegex = this.generateOpeningTagRegex(selector, bracketStyle);

    return this.hookFinder.findStandaloneHooks(content, openingTagRegex);
  }

  /**
   * Finds enclosing Angular component selectors
   *
   * @param content - The content to parse
   * @param selector - The Angular selector to find
   * @param bracketStyle - What bracket style to use
   */
  findEnclosingSelectors(content: string, selector: string, bracketStyle: {opening: string, closing: string} = {opening: '<', closing: '>'}): Array<HookPosition> {
    // Create opening and closing tag regex
    const openingTagRegex = this.generateOpeningTagRegex(selector, bracketStyle);
    const closingTagRegex =  this.generateClosingTagRegex(selector, bracketStyle);

    return this.hookFinder.findEnclosingHooks(content, openingTagRegex, closingTagRegex, true);
  }

  // Hook regex helper
  // ----------------------------------------------------------------------------------------------------------------------------------------

  /**
   * Generates the opening tag regex for a standard Angular component selector
   *
   * @param selector - The selector name
   * @param bracketStyle - What bracket style to use
   */
  private generateOpeningTagRegex(selector: string, bracketStyle: {opening: string, closing: string} = {opening: '<', closing: '>'}): RegExp {
    // Find opening tag of hook lazily
    // Examples for this regex: https://regex101.com/r/17x3cc/17
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
   *
   * @param selector - The selector of the hook
   * @param bracketStyle - What bracket style to use
   */
  private generateClosingTagRegex(selector: string, bracketStyle: {opening: string, closing: string} = {opening: '<', closing: '>'}): RegExp {
    const openingArrow = this.escapeRegex(bracketStyle.opening) + '\/';
    const selectorName = this.escapeRegex(selector);
    const closingArrow = this.escapeRegex(bracketStyle.closing);

    const fullRegex = openingArrow + selectorName + closingArrow;

    const regexObject = new RegExp(fullRegex, 'gims');

    return regexObject;
  }

  /**
   * Safely escapes a string for use in regex
   *
   * @param text - The string to escape
   */
  escapeRegex(text: string): string {
    return text.replace(new RegExp('[-\\/\\\\^$*+?.()|[\\]{}]', 'g'), '\\$&');
  }

}
