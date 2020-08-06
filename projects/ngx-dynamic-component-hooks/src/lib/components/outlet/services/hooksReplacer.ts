import { HookIndex } from '../../../interfaces';
import { HookParser, HookPosition } from '../../../interfacesPublic';
import { OutletOptions } from '../options/options';
import { ComponentFactoryResolver, isDevMode, Injectable, SecurityContext, Renderer2, RendererFactory2 } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

interface SelectorReplaceInstruction {
  startIndex: number;
  endIndex: number;
  replacement: string;
}

interface ParserResult {
  parser: HookParser;
  hookPosition: HookPosition;
}

@Injectable()
export class HooksReplacer {
  private renderer: Renderer2;

  constructor(private sanitizer: DomSanitizer, private cfr: ComponentFactoryResolver, private rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  // 1. Replacing hooks
  // -----------------------------------------------------------------------------------------------------------------------

  /**
   * Runs a set of parsers against a string of dynamic text and replaces all found hooks with their respective component
   * selector elements (that will remain empty for now). While doing so, it attaches various bits of info to the selector
   * element for later consumption when dynamically creating the component.
   * It also creates and returns a HookIndex.
   *
   * @param text - The text to parse
   * @param context - The context object from dynamicText to hand to each parser
   * @param parser - The parser to use
   * @param token - A random token to attach to all created selector elements
   * @param options - The current HookComponentOptions
   */
  replaceHooksWithNodes(text: string, context: {[key: string]: any}, parsers: Array<HookParser>, token: string, options: OutletOptions): {text: string, hookIndex: HookIndex} {
    let hookIndex: HookIndex = {};
    let hookCount = 0;

    // If empty, return nothing
    if (!text || text === '') {
      return {text: '', hookIndex: {} };
    }

    // Collect all parser results (before changing dynamicText), sort by startIndex
    let parserResults: Array<ParserResult> = [];
    for (const parser of parsers) {
      for (const hookPosition of parser.findHooks(text, context)) {
        parserResults.push({parser, hookPosition});
      }
    }
    parserResults.sort((a, b) => a.hookPosition.openingTagStartIndex - b.hookPosition.openingTagStartIndex);

    // Validate parser results
    parserResults = this.validateHookPositions(parserResults);

    // Process parser results to
    // a) Create an array of simple replace instructions for dynamicText (from where to where to replace with what)
    // b) Enter each found hook into hookIndex
    // c) Replace tag artifacts
    const selectorReplaceInstructions: Array<SelectorReplaceInstruction> = [];
    for (const pr of parserResults) {

      // Some info about this hook
      const isMultiTag = (Number.isInteger(pr.hookPosition.closingTagStartIndex) && Number.isInteger(pr.hookPosition.closingTagEndIndex));
      let textBeforeHook = text.substr(0, pr.hookPosition.openingTagStartIndex);
      let openingTag = text.substr(pr.hookPosition.openingTagStartIndex, pr.hookPosition.openingTagEndIndex - pr.hookPosition.openingTagStartIndex);
      let innerValue = isMultiTag ? text.substr(pr.hookPosition.openingTagEndIndex, pr.hookPosition.closingTagStartIndex - pr.hookPosition.openingTagEndIndex) : null;
      let closingTag = isMultiTag ? text.substr(pr.hookPosition.closingTagStartIndex, pr.hookPosition.closingTagEndIndex - pr.hookPosition.closingTagStartIndex) : null;
      let textAfterHook = isMultiTag ? text.substr(pr.hookPosition.closingTagEndIndex) : text.substr(pr.hookPosition.openingTagEndIndex);

      // Push opening and closing tag to replace instructions
      // Notes:
      // 1. Attach some parsing info as attributes for resolving them later
      // 2. Use encoded tag syntax to make them pass sanitization unnoticed (decoded again below after sanitization)
      // 3. Since the component selector of lazy-loaded components can't be known at this point, use placeholders tags for now (replaced in DynamicComponentCreator)
      // 4. Still use custom tags however to circumvent HTML nesting rules for established tags (browser might autocorrect nesting structure otherwise)
      selectorReplaceInstructions.push({
        startIndex: pr.hookPosition.openingTagStartIndex,
        endIndex: pr.hookPosition.openingTagEndIndex,
        replacement: '@@@hook-lt@@@dynamic-component-placeholder hookid=@@@hook-dq@@@' + hookCount + '@@@hook-dq@@@ parsetoken=@@@hook-dq@@@' + token + '@@@hook-dq@@@ ' + (pr.parser.name ? 'parser=@@@hook-dq@@@' + pr.parser.name + '@@@hook-dq@@@' : '') + '@@@hook-gt@@@'
      });
      selectorReplaceInstructions.push({
        startIndex: isMultiTag ? pr.hookPosition.closingTagStartIndex : pr.hookPosition.openingTagEndIndex,
        endIndex: isMultiTag ? pr.hookPosition.closingTagEndIndex : pr.hookPosition.openingTagEndIndex,
        replacement: '@@@hook-lt@@@/dynamic-component-placeholder@@@hook-gt@@@'
      });

      // Enter hook into index
      hookIndex[hookCount] = {
        id: hookCount,
        parser: pr.parser,
        value: {openingTag, closingTag},
        data: null,
        bindings: null,
        previousBindings: null,
        componentRef: null,
        dirtyInputs: new Set(),
        outputSubscriptions: {}
      };
      hookCount++;

      // Remove tag artifacts (does not change parser results indexes)
      if (isMultiTag && options.fixParagraphArtifacts) {
        const firstResult = this.removeTagArtifacts(textBeforeHook, '<p>', '</p>', innerValue, '</p>', '<p>');
        textBeforeHook = firstResult.firstText;
        innerValue = firstResult.secondText;

        const secondResult = this.removeTagArtifacts(innerValue, '<p>', '</p>', textAfterHook, '</p>', '<p>');
        innerValue = secondResult.firstText;
        textAfterHook = secondResult.secondText;

        text = textBeforeHook + openingTag + innerValue + closingTag + textAfterHook;
      }
    }

    // Sort replace instructions by startIndex so indexModifier only applies to indexes that follow, not precede
    selectorReplaceInstructions.sort((a, b) => a.startIndex - b.startIndex);

    // Replace found hooks with encoded component selectors
    let indexModifier = 0;
    for (const selectorReplaceInstruction of selectorReplaceInstructions) {
      const textBeforeSelector = text.substr(0, selectorReplaceInstruction.startIndex + indexModifier);
      const textAfterSelector = text.substr(selectorReplaceInstruction.endIndex + indexModifier);
      const oldDynamicTextLength = text.length;

      // Reassemble and correct index
      text = textBeforeSelector + selectorReplaceInstruction.replacement + textAfterSelector;
      indexModifier += text.length - oldDynamicTextLength;
    }

    // Sanitize? (ignores the encoded component selector elements)
    if (options.sanitize) {
      text = this.sanitizer.sanitize(SecurityContext.HTML, text);
    }

    // Decode component selector elements again
    text = this.decodeComponentSelectorElements(text);

    return {
      text: text,
      hookIndex: hookIndex
    };
  }

  /**
   * Checks the hookPositions of the combined parserResults to ensure they do not collide/overlap.
   * Any that do are removed from the results.
   *
   * @param parserResults - The parserResults from replaceHooksWithNodes()
   */
  private validateHookPositions(parserResults: Array<ParserResult>): Array<ParserResult> {
    const checkedParserResults = [];

    outerloop: for (const [index, parserResult] of parserResults.entries()) {
      const isMultiTag = (Number.isInteger(parserResult.hookPosition.closingTagStartIndex) && Number.isInteger(parserResult.hookPosition.closingTagEndIndex));
      const hookPos = parserResult.hookPosition;
      // Check if hook is in itself well-formed
      if (hookPos.openingTagStartIndex >= hookPos.openingTagEndIndex) {
        if (isDevMode()) { console.warn('Error when checking hook positions - openingTagEndIndex has to be greater than openingTagStartIndex. Ignoring.', hookPos); }
        continue;
      }
      if (isMultiTag && hookPos.closingTagStartIndex >= hookPos.closingTagEndIndex) {
        if (isDevMode()) { console.warn('Error when checking hook positions - closingTagEndIndex has to be greater than closingTagStartIndex. Ignoring.', hookPos); }
        continue;
      }
      if (isMultiTag && hookPos.openingTagEndIndex > hookPos.closingTagStartIndex) {
        if (isDevMode()) { console.warn('Error when checking hook positions - The closing tag must start after the opening tag has concluded. Ignoring.', hookPos); }
        continue;
      }

      // Check if hook overlaps with other hooks
      const previousHooks = parserResults.slice(0, index);
      innerloop: for (const previousHook of previousHooks) {
        const prevHookPos = previousHook.hookPosition;
        const prevIsMultiTag = (Number.isInteger(prevHookPos.closingTagStartIndex) && Number.isInteger(prevHookPos.closingTagEndIndex));

        // Check if identical hook position
        if (
          hookPos.openingTagStartIndex === prevHookPos.openingTagStartIndex &&
          hookPos.openingTagEndIndex === prevHookPos.openingTagEndIndex &&
          (!isMultiTag || !prevIsMultiTag || (
            hookPos.closingTagStartIndex === prevHookPos.closingTagStartIndex &&
            hookPos.closingTagEndIndex === prevHookPos.closingTagEndIndex
          ))
          ) {
          if (isDevMode()) { console.warn('A hook with the same position as another hook was found. There may be multiple identical parsers active that are looking for the same hook. Ignoring duplicates. \nPrevious: ', hookPos, '\nCurrent:', prevHookPos); }
          continue outerloop;
        }

        // Opening tag must begin after previous opening tag has ended
        if (hookPos.openingTagStartIndex < prevHookPos.openingTagEndIndex) {
          if (isDevMode()) { console.warn('Error when checking hook positions: Hook opening tag starts before previous hook opening tag ends. Ignoring. \nPrevious: ', hookPos, '\nCurrent:', prevHookPos); }
          continue outerloop;
        }

        // Opening tag must not overlap with previous closing tag
        if (prevIsMultiTag && !(
          hookPos.openingTagEndIndex <= prevHookPos.closingTagStartIndex ||
          hookPos.openingTagStartIndex >= prevHookPos.closingTagEndIndex
        )) {
          if (isDevMode()) { console.warn('Error when checking hook positions: Opening tag of hook overlaps with closing tag of previous hook. Ignoring. \nPrevious: ', hookPos, '\nCurrent:', prevHookPos); }
          continue outerloop;
        }

        // Closing tag must not overlap with previous closing tag
        if (prevIsMultiTag && isMultiTag && !(
          hookPos.closingTagEndIndex <= prevHookPos.closingTagStartIndex ||
          hookPos.closingTagStartIndex >= prevHookPos.closingTagEndIndex
        )) {
          if (isDevMode()) { console.warn('Error when checking hook positions: Closing tag of hook overlaps with closing tag of previous hook. Ignoring. \nPrevious: ', hookPos, '\nCurrent:', prevHookPos); }
          continue outerloop;
        }

        // Check if hooks are incorrectly nested, e.g. "<outer-hook><inner-hook></outer-hook></inner-hook>"
        if (isMultiTag && prevIsMultiTag &&
          hookPos.openingTagEndIndex <= prevHookPos.closingTagStartIndex &&
          hookPos.closingTagStartIndex >= prevHookPos.closingTagEndIndex
          ) {
            if (isDevMode()) { console.warn('Error when checking hook positions: The closing tag of a nested hook lies beyond the closing tag of the outer hook. Ignoring. \nOuter: ', hookPos, '\nInner:', prevHookPos); }
            continue outerloop;
        }

      }

      // If everything okay, add to result array
      checkedParserResults.push(parserResult);
    }

    return checkedParserResults;
  }

  /**
   * When using a multitag hook that is spread over several lines in an HTML editor, p-elements tend to get ripped apart. For example:
   *
   * <p><app-hook></p>
   *   <h2>This is the hook content</h2>
   * <p></app-hook></p>
   *
   * would cause the innerValue of hook to have a lone closing and opening p-tag (as would the outside of the hook).
   * To clean up the HTML, this function removes a pair of these artifacts (e.g. <p> before hook, </p> inside hook) if BOTH are found.
   * This is important as the HTML parser will otherwise mess up the intended HTML and sometimes even put what should be ng-content below the component.
   *
   * @param firstText - The text on one side of the hook
   * @param firstArtifact - A string that should be removed from firstText...
   * @param firstRemoveIfAfter - ...if it appears after the last occurrence of this string
   * @param secondText - The text on the other side of the hook
   * @param secondArtifact - A string that should be removed from secondText...
   * @param secondRemoveIfBefore - ...if it appears before the first occurrence of this string
   */
  private removeTagArtifacts(firstText: string, firstArtifact: string, firstRemoveIfAfter: string, secondText: string, secondArtifact: string = null, secondRemoveIfBefore: string): {firstText: string, secondText: string} {
    let firstArtifactFound = false;
    let secondArtifactFound = false;

    // a) Look for first artifact
    const firstArtifactIndex = firstText.lastIndexOf(firstArtifact);
    const firstArtifactIfAfterIndex = firstText.lastIndexOf(firstRemoveIfAfter);
    if (
      (firstArtifactIndex >= 0 && firstArtifactIfAfterIndex === -1) ||
      (firstArtifactIndex > firstArtifactIfAfterIndex)
    ) {
      firstArtifactFound = true;
    }

    // b) Look for second artifact
    const secondArtifactIndex = secondText.indexOf(secondArtifact);
    const secondArtifactIfBeforeIndex = secondText.indexOf(secondRemoveIfBefore);
    if (
      // If startArtifact appears before startArtifactNotBefore
      (secondArtifactIndex >= 0 && secondArtifactIfBeforeIndex === -1) ||
      (secondArtifactIndex < secondArtifactIfBeforeIndex)
    ) {
      secondArtifactFound = true;
    }

    // If artifacts found on both sides, remove both by overwriting them with empty spaces (doesn't change index)
    if (firstArtifactFound && secondArtifactFound) {
      firstText = firstText.substr(0, firstArtifactIndex) + ' '.repeat(firstArtifact.length) + firstText.substr(firstArtifactIndex + firstArtifact.length);
      secondText = secondText.substr(0, secondArtifactIndex) + ' '.repeat(secondArtifact.length) + secondText.substr(secondArtifactIndex + secondArtifact.length);
    }

    // Trim after artifacts removed
    return {
      firstText: firstText,
      secondText: secondText
    };
  }

  convertHTMLEntities(text: string): string {
    const div = this.renderer.createElement('div');
    const result = text.replace(/&[#A-Za-z0-9]+;/gi, (hmtlEntity) => {
        // Replace invisible nbsp-whitespace with normal whitespace (not \u00A0). Leads to problems with JSON.parse() otherwise.
        if (hmtlEntity === ('&nbsp;')) { return ' '; }
        div.innerHTML = hmtlEntity;
        return div.innerText;
    });
    return result;
  }

  decodeComponentSelectorElements(text: string): string {
    text = text.replace(/@@@hook-lt@@@/g, '<');
    text = text.replace(/@@@hook-gt@@@/g, '>');
    text = text.replace(/@@@hook-dq@@@/g, '"');
    return text;
  }
}
