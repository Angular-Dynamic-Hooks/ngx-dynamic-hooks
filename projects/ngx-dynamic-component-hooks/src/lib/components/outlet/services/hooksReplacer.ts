import { HookIndex } from '../../../interfaces';
import { HookParser, HookPosition } from '../../../interfacesPublic';
import { OutletOptions } from '../options/options';
import { isDevMode, Injectable, SecurityContext, Renderer2, RendererFactory2 } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * An atomic replace instruction. Reads as: Replace the text from startIndex to endIndex with replacement.
 */
interface ReplaceInstruction {
  startIndex: number;
  endIndex: number;
  replacement: string;
}

/**
 * Stores a HookPosition along with the parser who found it
 */
interface ParserResult {
  parser: HookParser;
  hookPosition: HookPosition;
}

/**
 * The service responsible for finding all Hooks in the content, replacing them with component placeholders
 * and creating the HookIndex
 */
@Injectable()
export class HooksReplacer {
  private renderer: Renderer2;

  constructor(private sanitizer: DomSanitizer, rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  // 1. Replacing hooks
  // -----------------------------------------------------------------------------------------------------------------------

  /**
   * Lets all registered parsers anaylyse the content to find all hooks within. Then replaces those hooks with component placeholder elements
   * (that will remain empty for now) and creates the hookIndex.
   *
   * It optionally also sanitizes the content and fixes paragraph artifacts.
   *
   * @param content - The text to parse
   * @param context - The current context object
   * @param parsers - All of the registered parsers
   * @param token - A random token to attach to all created selector elements
   * @param options - The current OutletOptions
   */
  replaceHooksWithNodes(content: string, context: {[key: string]: any}, parsers: Array<HookParser>, token: string, options: OutletOptions): {content: string, hookIndex: HookIndex} {
    const hookIndex: HookIndex = {};
    let hookCount = 0;

    // If empty, return nothing
    if (!content || content === '') {
      return {content: '', hookIndex: {} };
    }

    // Collect all parser results (before changing content), sort by startIndex
    let parserResults: Array<ParserResult> = [];
    for (const parser of parsers) {
      for (const hookPosition of parser.findHooks(content, context)) {
        parserResults.push({parser, hookPosition});
      }
    }
    parserResults.sort((a, b) => a.hookPosition.openingTagStartIndex - b.hookPosition.openingTagStartIndex);

    // Validate parser results
    parserResults = this.validateHookPositions(parserResults);

    // Process parser results to
    // a) Create an array of simple ReplaceInstructions to replace the hooks with the component placeholders
    // b) Enter each found hook into hookIndex
    // c) Replace tag artifacts
    const selectorReplaceInstructions: Array<ReplaceInstruction> = [];
    for (const pr of parserResults) {

      // Some info about this hook
      const isMultiTag = (Number.isInteger(pr.hookPosition.closingTagStartIndex) && Number.isInteger(pr.hookPosition.closingTagEndIndex));
      let textBeforeHook = content.substr(0, pr.hookPosition.openingTagStartIndex);
      let openingTag = content.substr(pr.hookPosition.openingTagStartIndex, pr.hookPosition.openingTagEndIndex - pr.hookPosition.openingTagStartIndex);
      let innerValue = isMultiTag ? content.substr(pr.hookPosition.openingTagEndIndex, pr.hookPosition.closingTagStartIndex - pr.hookPosition.openingTagEndIndex) : null;
      let closingTag = isMultiTag ? content.substr(pr.hookPosition.closingTagStartIndex, pr.hookPosition.closingTagEndIndex - pr.hookPosition.closingTagStartIndex) : null;
      let textAfterHook = isMultiTag ? content.substr(pr.hookPosition.closingTagEndIndex) : content.substr(pr.hookPosition.openingTagEndIndex);

      // Create ReplaceInstructions array
      // Notes:
      // 1. Attach some parsing info as attributes to the placeholders for dynamically creating the components later
      // 2. Use encoded tag syntax to make them pass sanitization unnoticed (decoded again below after sanitization)
      // 3. Since the component selector of lazy-loaded components can't be known at this point, use placeholders tags for now (replaced with real selectors in DynamicComponentCreator)
      // 4. Still use custom tags however to circumvent HTML nesting rules for established tags (browser might autocorrect nesting structure otherwise)
      selectorReplaceInstructions.push({
        startIndex: pr.hookPosition.openingTagStartIndex,
        endIndex: pr.hookPosition.openingTagEndIndex,
        replacement: this.encodeComponentPlaceholderElement('<dynamic-component-placeholder hookid="' + hookCount + '" parsetoken="' + token + '" ' + (pr.parser.name ? 'parser="' + pr.parser.name + '"' : '') + '>')});
      selectorReplaceInstructions.push({
        startIndex: isMultiTag ? pr.hookPosition.closingTagStartIndex : pr.hookPosition.openingTagEndIndex,
        endIndex: isMultiTag ? pr.hookPosition.closingTagEndIndex : pr.hookPosition.openingTagEndIndex,
        replacement: this.encodeComponentPlaceholderElement('</dynamic-component-placeholder>')
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

        content = textBeforeHook + openingTag + innerValue + closingTag + textAfterHook;
      }
    }

    // Sort replace instructions by startIndex so indexModifier only applies to indexes that follow, not precede
    selectorReplaceInstructions.sort((a, b) => a.startIndex - b.startIndex);

    // Replace found hooks with encoded component placeholders
    let indexModifier = 0;
    for (const selectorReplaceInstruction of selectorReplaceInstructions) {
      const textBeforeSelector = content.substr(0, selectorReplaceInstruction.startIndex + indexModifier);
      const textAfterSelector = content.substr(selectorReplaceInstruction.endIndex + indexModifier);
      const oldDynamicTextLength = content.length;

      // Reassemble and correct index
      content = textBeforeSelector + selectorReplaceInstruction.replacement + textAfterSelector;
      indexModifier += content.length - oldDynamicTextLength;
    }

    // Sanitize? (ignores the encoded component selector elements)
    if (options.sanitize) {
      content = this.sanitizer.sanitize(SecurityContext.HTML, content);
    }

    // Decode component selector elements again
    content = this.decodeComponentPlaceholderElements(content);

    return {
      content: content,
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
   * would cause the innerValue of app-hook to have a lone closing and opening p-tag (as their counterparts are outside of the hook).
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

  /**
   * Encodes the special html chars in a component placeholder tag
   *
   * @param element - The placeholder element as a string
   */
  encodeComponentPlaceholderElement(element: string): string {
    element = element.replace(/</g, '@@@hook-lt@@@');
    element = element.replace(/>/g, '@@@hook-gt@@@');
    element = element.replace(/"/g, '@@@hook-dq@@@');
    return element;
  }

  /**
   * Decodes the special html chars in a component placeholder tag
   *
   * @param element - The placeholder element as a string
   */
  decodeComponentPlaceholderElements(element: string): string {
    element = element.replace(/@@@hook-lt@@@/g, '<');
    element = element.replace(/@@@hook-gt@@@/g, '>');
    element = element.replace(/@@@hook-dq@@@/g, '"');
    return element;
  }

  /**
   * Converts all HTML entities to normal characters
   *
   * @param text - The text with the potential HTML entities
   */
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
}
