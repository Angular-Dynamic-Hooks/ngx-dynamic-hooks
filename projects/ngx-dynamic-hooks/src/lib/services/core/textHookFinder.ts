import { HookIndex } from '../../interfacesPublic';
import { HookParser, HookPosition } from '../../interfacesPublic';
import { isDevMode, Injectable } from '@angular/core';
import { AutoPlatformService } from '../platform/autoPlatformService';
import { anchorAttrHookId, anchorAttrParseToken, anchorElementTag } from '../../constants/core';
import { matchAll } from '../utils/utils';
import { ParseOptions } from '../settings/options';

const findInElementsNodePlaceholder = '_ngx_dynamic_hooks_node_placeholder';

/**
 * An atomic replace instruction. Reads as: Replace the text from startIndex to endIndex with replacement.
 */
export interface ReplaceInstruction {
  startIndex: number;
  endIndex: number;
  replacement: string;
}

/**
 * Stores a HookPosition along with the parser who found it
 */
export interface ParserFindHooksResult {
  parser: HookParser;
  hookPosition: HookPosition;
}

/**
 * Stores the HookValue as well as the text surrounding it
 */
export interface HookSegments {
  enclosing: boolean;
  textBefore: string;
  openingTag: string;
  innerValue: string|null;
  closingTag: string|null;
  textAfter: string;
}

/**
 * The service responsible for finding all text hooks in the content and replacing them with component anchors
 */
@Injectable({
  providedIn: 'root'
})
export class TextHookFinder {

  constructor(private platformService: AutoPlatformService) {
  }

  /**
   * Finds all text hooks in an existing element and creates the corresponding anchors
   * 
   * @param element - The element to parse
   * @param context - The current context object
   * @param parsers - All of the registered parsers
   * @param token - A random token to attach to all created selector elements
   * @param options - The current ParseOptions
   * @param hookIndex - The hookIndex object to fill
   */
  findInElement(element: any, context: any, parsers: HookParser[], token: string, options: ParseOptions, hookIndex: HookIndex) {
    // Only bother looking for text hooks if there even are text hook parsers
    for (const parser of parsers) {
      if (typeof parser.findHooks === 'function') {
        this.checkElement(element, context, parsers, token, options, hookIndex, {});
        break;
      }
    }
  }

  /**
   * Checks an individual element and travels it recursively
   * 
   * @param element - The element to parse
   * @param context - The current context object
   * @param parsers - All of the registered parsers
   * @param token - A random token to attach to all created selector elements
   * @param options - The current ParseOptions
   * @param hookIndex - The hookIndex object to fill 
   * @param extractedNodes - A recursively-used object holding all temporarily extracted nodes
   */
  checkElement(element: any, context: any, parsers: HookParser[], token: string, options: ParseOptions, hookIndex: HookIndex, extractedNodes: {[key: string]: any} = {}, ) {
    // To find text hooks in an already existing node, first replace non-text child nodes with string placeholders, then concat all text content.
    // This is so enclosing text hooks can be found even if they are separated by other elements
    let childNodes = this.platformService.getChildNodes(element);
    let collectedText = '';

    for (const childNode of childNodes) {
      if (this.platformService.isTextNode(childNode)) {
        collectedText += this.platformService.getTextContent(childNode);
      } else {
        const nodeId = Object.keys(extractedNodes).length + 1;
        extractedNodes[nodeId] = childNode;
        collectedText += `${findInElementsNodePlaceholder}__${nodeId}__`;
      }
    }    

    // Parse collected text, overwrite element content with result
    if (collectedText) {
      const prevHookCount = Object.keys(hookIndex).length;
      const result = this.find(collectedText, context, parsers, token, options, hookIndex);

      // If hooks were found, replace element.innerHTML with result.content
      if (prevHookCount < Object.keys(hookIndex).length) {
        const tmpDiv = this.platformService.createElement('div');
        this.platformService.setInnerContent(tmpDiv, result.content);
        childNodes = this.platformService.getChildNodes(tmpDiv);

        this.platformService.clearChildNodes(element);
        for (const node of childNodes) {
          this.platformService.appendChild(element, node);
        }
      }
    }

    // Then replace placeholders with previously extracted non-text nodes again
    for (const childNode of childNodes) {
      if (this.platformService.isTextNode(childNode)) {
        let text = this.platformService.getTextContent(childNode);
        if (text) {
          const matches = matchAll(text, new RegExp(`${findInElementsNodePlaceholder}__(\\d*)__`, 'g'));

          // If placeholders found
          if (matches.length) {
            const textReplacementNodes = [];
            let currentPos = 0;

            // Split text node containing placeholder into nodes array with restored nodes
            for (const match of matches) {
              const textBefore = text.substring(currentPos, match.index);
              const extractedNodeId = parseInt(match[1]);

              if (textBefore) {
                textReplacementNodes.push(this.platformService.createTextNode(textBefore));
              }
              if (extractedNodeId && extractedNodes[extractedNodeId]) {
                textReplacementNodes.push(extractedNodes[extractedNodeId]);
              }
              
              currentPos = match.index + match[0].length;
            }
            const textRemaining = text.substring(currentPos);
            if (textRemaining) {
              textReplacementNodes.push(this.platformService.createTextNode(textRemaining));
            }

            // Replace text node with that array
            const parent = this.platformService.getParentNode(childNode);
            for (const replacementNode of textReplacementNodes) {
              this.platformService.insertBefore(parent, replacementNode, childNode);
            }
            this.platformService.removeChild(parent, childNode);

            // Update child nodes var
            childNodes = this.platformService.getChildNodes(parent);
          }
        }
      }
    }

    // Travel child nodes recursively
    for (const childNode of childNodes) {
      if (childNode.nodeType !== Node.TEXT_NODE) {
        this.checkElement(childNode, context, parsers, token, options, hookIndex, extractedNodes);
      }
    }
  }

  /**
   * Finds all text hooks in a string variable and creates the corresponding anchors
   *
   * @param content - The text to parse
   * @param context - The current context object
   * @param parsers - All of the registered parsers
   * @param token - A random token to attach to all created selector elements
   * @param options - The current ParseOptions
   * @param hookIndex - The hookIndex object to fill
   */
  find(content: string, context: any, parsers: HookParser[], token: string, options: ParseOptions, hookIndex: HookIndex): {content: string, hookIndex: HookIndex} {

    // Convert input HTML entities?
    if (options.convertHTMLEntities) {
      content = this.convertHTMLEntities(content);
    }

    // Collect all parser results, sort by order of appearance
    let parserResults: ParserFindHooksResult[] = [];
    for (const parser of parsers) {
      if (typeof parser.findHooks === 'function') {
        for (const hookPosition of parser.findHooks(content, context)) {
          parserResults.push({parser, hookPosition});
        }
      }
    }
    parserResults.sort((a, b) => a.hookPosition.openingTagStartIndex - b.hookPosition.openingTagStartIndex);

    // Validate parser results
    parserResults = this.validateHookPositions(parserResults, content);

    // Process parser results
    const selectorReplaceInstructions: ReplaceInstruction[] = [];
    for (const pr of parserResults) {
      const hookId = Object.keys(hookIndex).length + 1;

      // Some info about this hook
      const hookSegments = this.getHookSegments(pr.hookPosition, content);

      // Prepare ReplaceInstructions array to replace all found hooks with anchor elements
      selectorReplaceInstructions.push({
        startIndex: pr.hookPosition.openingTagStartIndex,
        endIndex: pr.hookPosition.openingTagEndIndex,
        replacement: `<${anchorElementTag} ${anchorAttrHookId}="${hookId}" ${anchorAttrParseToken}="${token}">`
      });
      selectorReplaceInstructions.push({
        startIndex: hookSegments.enclosing ? pr.hookPosition.closingTagStartIndex! : pr.hookPosition.openingTagEndIndex,
        endIndex: hookSegments.enclosing ? pr.hookPosition.closingTagEndIndex! : pr.hookPosition.openingTagEndIndex,
        replacement: `</${anchorElementTag}>`
      });

      // Enter hook into index
      hookIndex[hookId] = {
        id: hookId,
        parser: pr.parser,
        value: {
          openingTag: hookSegments.openingTag,
          closingTag: hookSegments.closingTag,
          element: null,
          elementSnapshot: null
        },
        data: null,
        isLazy: false,
        bindings: null,
        previousBindings: null,
        componentRef: null,
        dirtyInputs: new Set(),
        outputSubscriptions: {},
        htmlEventSubscriptions: {}
      };

      // Remove tag artifacts (does not change parser results indexes)
      if (hookSegments.enclosing && options.fixParagraphTags) {
        const firstResult = this.removeTagArtifacts(hookSegments.textBefore, '<p>', '</p>', hookSegments.innerValue!, '</p>', '<p>');
        hookSegments.textBefore = firstResult.firstText;
        hookSegments.innerValue = firstResult.secondText;

        const secondResult = this.removeTagArtifacts(hookSegments.innerValue, '<p>', '</p>', hookSegments.textAfter, '</p>', '<p>');
        hookSegments.innerValue = secondResult.firstText;
        hookSegments.textAfter = secondResult.secondText;

        content = hookSegments.textBefore + hookSegments.openingTag + hookSegments.innerValue + hookSegments.closingTag + hookSegments.textAfter;
      }
    }

    // Actually replace hooks with anchors (from the back, so no need to change indexes)
    selectorReplaceInstructions.sort((a, b) => b.startIndex - a.startIndex);
    for (const selectorReplaceInstruction of selectorReplaceInstructions) {
      const textBeforeSelector = content.substring(0, selectorReplaceInstruction.startIndex);
      const textAfterSelector = content.substring(selectorReplaceInstruction.endIndex);
      content = textBeforeSelector + selectorReplaceInstruction.replacement + textAfterSelector;
    }

    return {
      content: content,
      hookIndex: hookIndex
    };
  }

  /**
   * Takes a HookPosition and returns the HookValue as well as the text surrounding it
   *
   * @param hookPosition - The HookPosition in question
   * @param content - The source text for the HookPosition
   */
  private getHookSegments(hookPosition: HookPosition, content: string): HookSegments {
    const enclosing = (Number.isInteger(hookPosition.closingTagStartIndex) && Number.isInteger(hookPosition.closingTagEndIndex));
    return {
      enclosing: enclosing,
      textBefore: content.substring(0, hookPosition.openingTagStartIndex),
      openingTag: content.substring(hookPosition.openingTagStartIndex, hookPosition.openingTagEndIndex),
      innerValue: enclosing ? content.substring(hookPosition.openingTagEndIndex, hookPosition.closingTagStartIndex!) : null,
      closingTag: enclosing ? content.substring(hookPosition.closingTagStartIndex!, hookPosition.closingTagEndIndex!) : null,
      textAfter: enclosing ? content.substring(hookPosition.closingTagEndIndex!) : content.substring(hookPosition.openingTagEndIndex)
    };
  }

  /**
   * Checks the hookPositions of the combined parserResults to ensure they do not collide/overlap.
   * Any that do are removed from the results.
   *
   * @param parserResults - The parserResults from replaceHooksWithNodes()
   * @param content - The source text for the parserResults
   */
  private validateHookPositions(parserResults: ParserFindHooksResult[], content: string): ParserFindHooksResult[] {
    const checkedParserResults = [];

    outerloop: for (const [index, parserResult] of parserResults.entries()) {
      const enclosing = (Number.isInteger(parserResult.hookPosition.closingTagStartIndex) && Number.isInteger(parserResult.hookPosition.closingTagEndIndex));
      const hookPos = parserResult.hookPosition;

      // Check if hook is in itself well-formed
      if (hookPos.openingTagStartIndex >= hookPos.openingTagEndIndex) {
        if (isDevMode()) { console.warn('Text hook error: openingTagEndIndex has to be greater than openingTagStartIndex. Ignoring.', hookPos); }
        continue;
      }
      if (enclosing && hookPos.openingTagEndIndex > hookPos.closingTagStartIndex!) {
        if (isDevMode()) { console.warn('Text hook error: closingTagStartIndex has to be greater than openingTagEndIndex. Ignoring.', hookPos); }
        continue;
      }
      if (enclosing && hookPos.closingTagStartIndex! >= hookPos.closingTagEndIndex!) {
        if (isDevMode()) { console.warn('Text hook error: closingTagEndIndex has to be greater than closingTagStartIndex. Ignoring.', hookPos); }
        continue;
      }

      // Check if hook overlaps with other hooks
      const previousHooks = parserResults.slice(0, index);
      innerloop: for (const previousHook of previousHooks) {
        const prevHookPos = previousHook.hookPosition;
        const prevIsEnclosing = (Number.isInteger(prevHookPos.closingTagStartIndex) && Number.isInteger(prevHookPos.closingTagEndIndex));

        // Check if identical hook position
        if (
          hookPos.openingTagStartIndex === prevHookPos.openingTagStartIndex &&
          hookPos.openingTagEndIndex === prevHookPos.openingTagEndIndex &&
          (!enclosing || !prevIsEnclosing || (
            hookPos.closingTagStartIndex === prevHookPos.closingTagStartIndex &&
            hookPos.closingTagEndIndex === prevHookPos.closingTagEndIndex
          ))
          ) {
          this.generateHookPosWarning('A text hook with the same position as another text hook was found. There may be multiple parsers looking for the same text pattern. Ignoring duplicates.', hookPos, prevHookPos, content);
          continue outerloop;
        }

        // Opening tag must begin after previous opening tag has ended
        if (hookPos.openingTagStartIndex < prevHookPos.openingTagEndIndex) {
          this.generateHookPosWarning('Text hook error: Hook opening tag starts before previous hook opening tag ends. Ignoring.', hookPos, prevHookPos, content);
          continue outerloop;
        }

        // Just need to check for collisions with previous closing tag now
        
        // Opening tag must not overlap with previous closing tag
        if (prevIsEnclosing && !(
          hookPos.openingTagEndIndex <= prevHookPos.closingTagStartIndex! ||
          hookPos.openingTagStartIndex >= prevHookPos.closingTagEndIndex!
        )) {
          this.generateHookPosWarning('Text hook error: Opening tag of hook overlaps with closing tag of previous hook. Ignoring.', hookPos, prevHookPos, content);
          continue outerloop;
        }

        // Closing tag must not overlap with previous closing tag
        if (prevIsEnclosing && enclosing && !(
          hookPos.closingTagEndIndex! <= prevHookPos.closingTagStartIndex! ||
          hookPos.closingTagStartIndex! >= prevHookPos.closingTagEndIndex!
        )) {
          this.generateHookPosWarning('Text hook error: Closing tag of hook overlaps with closing tag of previous hook. Ignoring.', hookPos, prevHookPos, content);
          continue outerloop;
        }

        // Check if hooks are incorrectly nested, e.g. "<outer-hook><inner-hook></outer-hook></inner-hook>"
        if (enclosing && prevIsEnclosing &&
          hookPos.openingTagEndIndex <= prevHookPos.closingTagStartIndex! &&
          hookPos.closingTagStartIndex! >= prevHookPos.closingTagEndIndex!
          ) {
            this.generateHookPosWarning('Text hook error: The closing tag of a nested hook lies beyond the closing tag of the outer hook. Ignoring.', hookPos, prevHookPos, content);
            continue outerloop;
        }
      }

      // If everything okay, add to result array
      checkedParserResults.push(parserResult);
    }

    return checkedParserResults;
  }

  /**
   * Outputs a warning in the console when the positions of two hooks are invalid in some manner
   *
   * @param message - The error message
   * @param hookPos - The first HookPosition
   * @param prevHookPos - The second HookPosition
   * @param content - The source text for the HookPositions
   */
  private generateHookPosWarning(message: string, hookPos: HookPosition, prevHookPos: HookPosition, content: string): void {
    if (isDevMode()) {
      const prevHookSegments = this.getHookSegments(prevHookPos, content);
      const hookSegments = this.getHookSegments(hookPos, content);

      const prevHookData = {
        openingTag: prevHookSegments.openingTag,
        openingTagStartIndex: prevHookPos.openingTagStartIndex,
        openingTagEndIndex: prevHookPos.openingTagEndIndex,
        closingTag: prevHookSegments.closingTag,
        closingTagStartIndex: prevHookPos.closingTagStartIndex,
        closingTagEndIndex: prevHookPos.closingTagEndIndex
      };
      const hookData = {
        openingTag: hookSegments.openingTag,
        openingTagStartIndex: hookPos.openingTagStartIndex,
        openingTagEndIndex: hookPos.openingTagEndIndex,
        closingTag: hookSegments.closingTag,
        closingTagStartIndex: hookPos.closingTagStartIndex,
        closingTagEndIndex: hookPos.closingTagEndIndex
      };

      console.warn(message + '\nFirst hook: ', prevHookData, '\nSecond hook:', hookData);
    }
  }

  /**
   * When using an enclosing hook that is spread over several lines in an HTML editor, p-elements tend to get ripped apart. For example:
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
  private removeTagArtifacts(firstText: string, firstArtifact: string, firstRemoveIfAfter: string, secondText: string, secondArtifact: string, secondRemoveIfBefore: string): {firstText: string, secondText: string} {
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
      firstText = firstText.substring(0, firstArtifactIndex) + ' '.repeat(firstArtifact.length) + firstText.substring(firstArtifactIndex + firstArtifact.length);
      secondText = secondText.substring(0, secondArtifactIndex) + ' '.repeat(secondArtifact.length) + secondText.substring(secondArtifactIndex + secondArtifact.length);
    }

    // Trim after artifacts removed
    return {
      firstText: firstText,
      secondText: secondText
    };
  }

  /**
   * Converts all HTML entities to normal characters
   *
   * @param text - The text with the potential HTML entities
   */
  convertHTMLEntities(text: string): string {
    const div = this.platformService.createElement('div');
    const result = text.replace(/&[#A-Za-z0-9]+;/gi, (hmtlEntity) => {
        // Replace invisible nbsp-whitespace with normal whitespace (not \u00A0). Leads to problems with JSON.parse() otherwise.
        if (hmtlEntity === ('&nbsp;')) { return ' '; }
        this.platformService.setInnerContent(div, hmtlEntity);
        return this.platformService.getTextContent(div)!;
    });
    return result;
  }
}
