import { Injectable, Renderer2, RendererFactory2, Optional, Inject, Injector } from '@angular/core';
import { of, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { HookIndex } from '../../../interfacesPublic';
import { HookParser, OutletParseResult } from '../../../interfacesPublic';
import { OutletOptions, outletOptionDefaults } from '../options/options';
import { HooksReplacer } from './hooksReplacer';
import { ComponentCreator } from './componentCreator';
import { DYNAMICHOOKS_GLOBALSETTINGS, DynamicHooksGlobalSettings } from '../../../globalSettings';
import { ParserEntryResolver } from '../options/parserEntryResolver';
import { OptionsResolver } from '../options/optionsResolver';
import { HookParserEntry } from '../options/parserEntry';

/**
 * Serves as a programmatic layer of abstraction of the functionality used in OutletComponent, so that its
 * functionality can also be used without actually inserting the <ngx-dynamic-hooks>-component
 */
@Injectable()
export class OutletService {
  private renderer: Renderer2;

  constructor(
    @Optional() @Inject(DYNAMICHOOKS_GLOBALSETTINGS) private globalSettings: DynamicHooksGlobalSettings,
    private parserEntryResolver: ParserEntryResolver,
    private optionsResolver: OptionsResolver,
    private hooksReplacer: HooksReplacer,
    private componentCreator: ComponentCreator,
    private rendererFactory: RendererFactory2,
    private injector: Injector
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Parses a string of content and loads components for all found hooks
   *
   * @param content - The input content to parse
   * @param context - An optional context object
   * @param globalParsersBlacklist - An optional list of global parsers to blacklist
   * @param globalParsersWhitelist - An optional list of global parsers to whitelist
   * @param parsers - An optional list of parsers to use instead of the global ones
   * @param options - An optional list of options to use instead of the global ones
   * @param targetElement - An optional HTML element to use as the container for the loaded content. If none is provided, one is created and returned for you.
   * @param targetHookIndex - An optional object to fill with the programmatic hook data. If none is provided, one is created and returned for you.
   * @param injector - An optional injector to use for the dynamically-loaded components. If none is provided, the root injector is used.
   */
  parse(
    content: string,
    context: any = {},
    globalParsersBlacklist: Array<string> = null,
    globalParsersWhitelist: Array<string> = null,
    parsers: Array<HookParserEntry> = null,
    options: OutletOptions = null,
    targetElement: HTMLElement = null,
    targetHookIndex: HookIndex = null,
    injector: Injector = null
  ): Observable<OutletParseResult> {

    // If no container element or hookIndex given, create them
    if (targetElement === null) {
      targetElement = this.renderer.createElement('div');
    }
    if (targetHookIndex === null) {
      targetHookIndex = {};
    }

    // Resolve options and parsers
    const resolvedOptions = this.loadOptions(options);
    const resolvedParsers = this.loadParsers(parsers, injector || this.injector, globalParsersBlacklist, globalParsersWhitelist);

    // Needs a content string
    if (!content || typeof content !== 'string') {
      return of({
        element: targetElement,
        hookIndex: targetHookIndex,
        resolvedParsers,
        resolvedOptions
      });
    }

    // Convert input HTML entities?
    if (resolvedOptions.convertHTMLEntities) {
      content = this.hooksReplacer.convertHTMLEntities(content);
    }

    // Replace hooks with component selector elements
    const token = Math.random().toString(36).substr(2, 10);
    const result = this.hooksReplacer.replaceHooksWithNodes(content, context, resolvedParsers, token, resolvedOptions, targetHookIndex);
    content = result.content;

    // Parse HTML
    targetElement.innerHTML = content;

    // Dynamically create components in component selector elements
    return this.componentCreator.init(targetElement, targetHookIndex, token, context, resolvedOptions, injector || this.injector)
    .pipe(first())
    .pipe(map((allComponentsLoaded: boolean) => {
      // Everything done! Return finished hookIndex and resolved parsers and options
      return {
        element: targetElement,
        hookIndex: targetHookIndex,
        resolvedParsers,
        resolvedOptions
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
      // Unsubscribe from hook outputs
      for (const hook of Object.values(hookIndex)) {
        for (const sub of Object.values(hook.outputSubscriptions)) {
          if (sub) {
            sub.unsubscribe();
          }
        }
      }

      // Destroy dynamic components
      for (const hookIndexEntry of Object.values(hookIndex)) {
        if (hookIndexEntry.componentRef) {
          hookIndexEntry.componentRef.destroy();
        }
      }
    }
  }

  // ----------------------------------------------------------------------------------------------------------

  /**
   * Loads the relevant outlet options
   */
  private loadOptions(options: OutletOptions): OutletOptions {
    let resolvedOptions: OutletOptions;

    // If local
    if (options) {
      resolvedOptions = this.optionsResolver.resolve(options);
    // If global
    } else if (this.globalSettings && this.globalSettings.hasOwnProperty('globalOptions')) {
      resolvedOptions = this.optionsResolver.resolve(this.globalSettings.globalOptions);
    // If none given
    } else {
      resolvedOptions = outletOptionDefaults;
    }

    return resolvedOptions;
  }

  /**
   * Loads the relevant parser configuration
   */
  private loadParsers(parsers: Array<HookParserEntry>, injector: Injector, globalParsersBlacklist: Array<string>, globalParsersWhitelist: Array<string>): Array<HookParser> {
    let resolvedParsers: Array<HookParser>;

    // If local
    if (parsers) {
      resolvedParsers = this.parserEntryResolver.resolve(parsers, injector);
    // If global
    } else if (this.globalSettings && this.globalSettings.hasOwnProperty('globalParsers')) {
      resolvedParsers = this.parserEntryResolver.resolve(this.globalSettings.globalParsers, injector, globalParsersBlacklist, globalParsersWhitelist);
    // If none given
    } else {
      resolvedParsers = [];
    }

    return resolvedParsers;
  }





}
