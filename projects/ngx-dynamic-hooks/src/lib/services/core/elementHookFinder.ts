import { HookIndex } from '../../interfacesPublic';
import { HookParser, HookPosition } from '../../interfacesPublic';
import { isDevMode, Injectable } from '@angular/core';
import { AutoPlatformService } from '../platform/autoPlatformService';
import { sortElements } from '../utils/utils';
import { anchorAttrHookId, anchorAttrParseToken } from '../../constants/core';
import { ParseOptions } from '../settings/options';

/**
 * Stores a hook element along with the parser who found it
 */
export interface ParserFindHookElementsResult {
  parser: HookParser;
  hookElement: any;
}

@Injectable({
  providedIn: 'root'
})
export class ElementHookFinder {

  constructor(private platformService: AutoPlatformService) {
  }

  find(contentElement: any, context: any, parsers: HookParser[], token: string, options: ParseOptions, hookIndex: HookIndex): HookIndex {

    // Collect all parser results
    let parserResults: ParserFindHookElementsResult[] = [];
    for (const parser of parsers) {
      if (typeof parser.findHookElements === 'function') {
        for (const hookElement of parser.findHookElements(contentElement, context)) {
          parserResults.push({parser, hookElement});
        }
      }
    }
    parserResults = sortElements(parserResults, this.platformService.sortElements.bind(this.platformService), entry => entry.hookElement);

    // Validate parser results
    parserResults = this.validateHookElements(parserResults, contentElement);

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
        outputSubscriptions: {}
      };

      // Add anchor attrs
      this.platformService.setAttribute(pr.hookElement, anchorAttrHookId, hookId.toString());
      this.platformService.setAttribute(pr.hookElement, anchorAttrParseToken, token);
    }

    return hookIndex;
  }



  /**
   * Checks the hookPositions of the combined parserResults to ensure they do not collide/overlap.
   * Any that do are removed from the results.
   *
   * @param parserResults - The parserResults from replaceHooksWithNodes()
   * @param content - The source text for the parserResults
   */
  private validateHookElements(parserResults: ParserFindHookElementsResult[], contentElement: any): ParserFindHookElementsResult[] {
    const checkedParserResults = [];

    for (const [index, parserResult] of parserResults.entries()) {
      const previousCheckedParserResults = checkedParserResults.slice(0, index);
      const wasFoundAsElementHookAlready = previousCheckedParserResults.findIndex(entry => entry.hookElement === parserResult.hookElement) >= 0;

      // Must not already be hook anchor (either from previous iteration of loop or string hook finder)
      if (
        wasFoundAsElementHookAlready ||
        this.platformService.getAttributeNames(parserResult.hookElement).includes(anchorAttrHookId) || 
        this.platformService.getAttributeNames(parserResult.hookElement).includes(anchorAttrParseToken)
      ) {
        if (isDevMode()) { console.warn('Error when checking hook elements - The following element was already found as a hook element, but was found again in the same parse. There may be multiple identical parsers active that are looking for the same hook. Ignoring.', parserResult.hookElement); }
        continue;
      }

      // Must not already be host or view element for an Angular component
      if (this.isAngularManagedElement(parserResult.hookElement)) {
        if (isDevMode()) { console.warn('Note: The following element was found as a hook, but is already being used as an active host or view element for an Angular component. Ignoring.', parserResult.hookElement); }
        continue;
      }

      // If everything okay, add to result array
      checkedParserResults.push(parserResult);
    }

    return checkedParserResults;
  }
  
  private isAngularManagedElement(element: any): boolean {
    // Angular gives component host and view elements the following property, so can simply check for that
    return !!element.__ngContext__;
  }
}
