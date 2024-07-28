import { HookIndex } from '../../interfacesPublic';
import { HookParser } from '../../interfacesPublic';
import { Injectable } from '@angular/core';
import { AutoPlatformService } from '../platform/autoPlatformService';
import { sortElements } from '../utils/utils';
import { anchorAttrHookId, anchorAttrParseToken } from '../../constants/core';
import { ParseOptions } from '../settings/options';
import { Logger } from '../utils/logger';

/**
 * Stores a hook element along with the parser who found it
 */
export interface ParserFindHookElementsResult {
  parser: HookParser;
  hookElement: any;
}

/**
 * The service responsible for finding element hooks in the content and marking them with anchor attrs
 */
@Injectable({
  providedIn: 'root'
})
export class ElementHookFinder {

  constructor(private platformService: AutoPlatformService, private logger: Logger) {
  }

  /**
   * Finds all element hooks in an element and marks the corresponding anchor elements
   *
   * @param contentElement - The content element to parse
   * @param context - The current context object
   * @param parsers - The parsers to use
   * @param token - The current parse token
   * @param options - The current ParseOptions
   * @param hookIndex - The hookIndex object to fill
   */
  find(contentElement: any, context: any, parsers: HookParser[], token: string, options: ParseOptions, hookIndex: HookIndex): HookIndex {

    // Collect all parser results
    let parserResults: ParserFindHookElementsResult[] = [];
    for (const parser of parsers) {
      if (typeof parser.findHookElements === 'function') {
        for (const hookElement of parser.findHookElements(contentElement, context, options)) {
          parserResults.push({parser, hookElement});
        }
      }
    }
    parserResults = sortElements(parserResults, this.platformService.sortElements.bind(this.platformService), entry => entry.hookElement);

    // Validate parser results
    parserResults = this.validateHookElements(parserResults, contentElement, options);

    // Process parser results
    for (const pr of parserResults) {
      const hookId = Object.keys(hookIndex).length + 1;

      // Enter hook into index
      hookIndex[hookId] = {
        id: hookId,
        parser: pr.parser,
        value: {
          openingTag: this.platformService.getOpeningTag(pr.hookElement),
          closingTag: this.platformService.getClosingTag(pr.hookElement),
          element: pr.hookElement,
          elementSnapshot: this.platformService.cloneElement(pr.hookElement)
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

      // Add anchor attrs
      this.platformService.setAttribute(pr.hookElement, anchorAttrHookId, hookId.toString());
      this.platformService.setAttribute(pr.hookElement, anchorAttrParseToken, token);
    }

    return hookIndex;
  }

  /**
   * Checks the combined parserResults and validates them. Invalid ones are removed.
   *
   * @param parserResults - The parserResults to check
   * @param contentElement - The content element
   * @param options - The current ParseOptions
   */
  private validateHookElements(parserResults: ParserFindHookElementsResult[], contentElement: any, options: ParseOptions): ParserFindHookElementsResult[] {
    const checkedParserResults = [];

    for (const [index, parserResult] of parserResults.entries()) {
      const previousCheckedParserResults = checkedParserResults.slice(0, index);
      const wasFoundAsElementHookAlready = previousCheckedParserResults.findIndex(entry => entry.hookElement === parserResult.hookElement) >= 0;

      // Must not already be a hook anchor (either from previous iteration of loop or text hook finder)
      if (
        wasFoundAsElementHookAlready ||
        this.platformService.getAttributeNames(parserResult.hookElement).includes(anchorAttrHookId) || 
        this.platformService.getAttributeNames(parserResult.hookElement).includes(anchorAttrParseToken)
      ) {
        this.logger.warn(['An element hook tried to use an element that was found by another hook before. There may be multiple parsers looking for the same elements. Ignoring duplicates.', parserResult.hookElement], options)
        continue;
      }

      // Must not already be host or view element for an Angular component
      if (this.isAngularManagedElement(parserResult.hookElement)) {
        this.logger.warn(['A hook element was found that is already a host or view element of an active Angular component. Ignoring.', parserResult.hookElement], options);
        continue;
      }

      // If everything okay, add to result array
      checkedParserResults.push(parserResult);
    }

    return checkedParserResults;
  }
  
  /**
   * Indicates if an element is either a component host element or part of a component's view/template
   * 
   * @param element - The element to inspect
   */
  private isAngularManagedElement(element: any): boolean {
    // Angular gives component host and view elements the following property, so can simply check for that
    return element.__ngContext__ !== undefined;
  }
}
