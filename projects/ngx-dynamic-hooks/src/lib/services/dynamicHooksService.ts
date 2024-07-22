import { Injectable, Optional, Inject, Injector, EnvironmentInjector } from '@angular/core';
import { of, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { HookIndex, ParseResult } from '../interfacesPublic';
import { ParseOptions } from './settings/options';
import { TextHookFinder } from './core/textHookFinder';
import { ComponentCreator } from './core/componentCreator';
import { DynamicHooksSettings } from './settings/settings';
import { HookParserEntry } from './settings/parserEntry';
import { DYNAMICHOOKS_ALLSETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, DYNAMICHOOKS_MODULESETTINGS } from '../interfaces';
import { SettingsResolver } from './settings/settingsResolver';
import { ContentSanitizer } from './utils/contentSanitizer';
import { AutoPlatformService } from './platform/autoPlatformService';
import { ElementHookFinder } from './core/elementHookFinder';

/**
 * Serves as a programmatic layer of abstraction of the functionality used in DynamicHooksComponent, so that its
 * functionality can also be used without actually inserting the <ngx-dynamic-hooks>-component
 */
@Injectable({
  providedIn: 'root'
})
export class DynamicHooksService {

  constructor(
    @Optional() @Inject(DYNAMICHOOKS_ALLSETTINGS) private allSettings: DynamicHooksSettings[]|null,
    @Optional() @Inject(DYNAMICHOOKS_ANCESTORSETTINGS) public ancestorSettings: DynamicHooksSettings[]|null,
    @Optional() @Inject(DYNAMICHOOKS_MODULESETTINGS) private moduleSettings: DynamicHooksSettings|null,
    private settingsResolver: SettingsResolver,
    private textHookFinder: TextHookFinder,
    private elementHookFinder: ElementHookFinder,
    private contentSanitizer: ContentSanitizer,
    private componentCreator: ComponentCreator,
    private platformService: AutoPlatformService,
    private environmentInjector: EnvironmentInjector,
    private injector: Injector
  ) {
  }

  /**
   * Parses a string of content and loads components for all found hooks
   *
   * @param content - The content to parse
   * @param context - An optional context object
   * @param globalParsersBlacklist - An optional list of global parsers to blacklist
   * @param globalParsersWhitelist - An optional list of global parsers to whitelist
   * @param parsers - An optional list of parsers to use instead of the global ones
   * @param options - An optional list of options to use instead of the global ones
   * @param targetElement - An optional HTML element to use as the container for the loaded content. If none is provided, one is created and returned for you.
   * @param targetHookIndex - An optional object to fill with the programmatic hook data. If none is provided, one is created and returned for you.
   * @param injector - An optional injector to use for the dynamically-loaded components. If none is provided, the injector of the module this library is imported to is used.
   */
  parse(
    content: any = null,
    context: any = null,
    globalParsersBlacklist: string[]|null = null,
    globalParsersWhitelist: string[]|null = null,
    parsers: HookParserEntry[]|null = null,
    options: ParseOptions|null = null,
    targetElement: HTMLElement|null = null,
    targetHookIndex: HookIndex = {},
    environmentInjector: EnvironmentInjector|null = null,
    injector: Injector|null = null
  ): Observable<ParseResult> {
    const usedEnvironmentInjector = environmentInjector || this.environmentInjector;
    const usedInjector = injector || this.injector;

    // Resolve options and parsers
    const { parsers: usedParsers, options: usedOptions } = this.settingsResolver.resolve(
      usedInjector, // Use element injector for resolving service parsers (instead of environment injector). Will fallback to environment injector anyway if doesn't find anything.
      content,
      this.allSettings, 
      this.ancestorSettings, 
      this.moduleSettings, 
      parsers, 
      options, 
      globalParsersBlacklist, 
      globalParsersWhitelist
    );

    // Needs string or element as content
    if (!content) {
      return of({
        element: targetElement || this.platformService.createElement('div'),
        hookIndex: targetHookIndex,
        context: context,
        usedParsers,
        usedOptions,
        usedInjector,
        usedEnvironmentInjector,
        destroy: () => this.destroy(targetHookIndex)
      });
    }

    const token = Math.random().toString(36).substring(2, 12);
    let contentElement;

    // a) Find all text hooks in string content
    if (typeof content === 'string') {
      contentElement = this.platformService.createElement('div');
      const result = this.textHookFinder.find(content, context, usedParsers, token, usedOptions, targetHookIndex);
      this.platformService.setInnerContent(contentElement, result.content);
      
    // b) Find all text hooks in element content
    } else {
      contentElement = content;
      this.textHookFinder.findInElement(contentElement, context, usedParsers, token, usedOptions, targetHookIndex);
    }

    // Find all element hooks
    targetHookIndex = this.elementHookFinder.find(contentElement, context, usedParsers, token, usedOptions, targetHookIndex);

    // Sanitize?
    if (usedOptions?.sanitize) {
      this.contentSanitizer.sanitize(contentElement, targetHookIndex, token);
    }

    // Insert virtual content into targetElement
    if (targetElement && targetElement !== contentElement) {
      this.platformService.clearChildNodes(targetElement);
      for (const childNode of this.platformService.getChildNodes(contentElement)) {
        this.platformService.appendChild(targetElement, childNode);
      }
      contentElement = targetElement
    }

    // Dynamically create components in component selector elements
    return this.componentCreator.init(contentElement, targetHookIndex, token, context, usedOptions, usedEnvironmentInjector, usedInjector)
    .pipe(first())
    .pipe(map((allComponentsLoaded: boolean) => {
      // Everything done! Return finished hookIndex and resolved parsers and options
      return {
        element: contentElement,
        hookIndex: targetHookIndex,
        context: context,
        usedParsers,
        usedOptions,
        usedInjector,
        usedEnvironmentInjector,
        destroy: () => this.destroy(targetHookIndex)
      };
    }));
  }

  /**
   * Cleanly destroys all loaded components in a given HookIndex
   *
   * @param hookIndex - The hookIndex to process
   */
  destroy(hookIndex: HookIndex): void {
    if (hookIndex) {
      // Destroy dynamic components
      for (const hookIndexEntry of Object.values(hookIndex)) {
        if (hookIndexEntry.componentRef) {
          hookIndexEntry.componentRef.destroy();
        }
      }

      // Unsubscribe from hook outputs
      for (const hook of Object.values(hookIndex)) {
        for (const parserSub of Object.values(hook.outputSubscriptions)) {
          if (parserSub) { parserSub.unsubscribe(); }
        }
        for (const htmlEventSub of Object.values(hook.htmlEventSubscriptions)) {
          if (htmlEventSub) { htmlEventSub.unsubscribe(); }
        }
      }
    }
  }

}
