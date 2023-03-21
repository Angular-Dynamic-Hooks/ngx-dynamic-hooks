import { Injectable, Renderer2, RendererFactory2, Optional, Inject, Injector } from '@angular/core';
import { of, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { HookIndex } from '../../../interfacesPublic';
import { HookParser, OutletParseResult } from '../../../interfacesPublic';
import { OutletOptions, outletOptionDefaults } from '../options/options';
import { HooksReplacer } from './hooksReplacer';
import { ComponentCreator } from './componentCreator';
import { DynamicHooksGlobalSettings, DynamicHooksInheritance } from '../../../globalSettings';
import { ParserEntryResolver } from '../options/parserEntryResolver';
import { OptionsResolver } from '../options/optionsResolver';
import { HookParserEntry } from '../options/parserEntry';
import { DYNAMICHOOKS_ALLSETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, DYNAMICHOOKS_MODULESETTINGS } from '../../../interfaces';

/**
 * Serves as a programmatic layer of abstraction of the functionality used in OutletComponent, so that its
 * functionality can also be used without actually inserting the <ngx-dynamic-hooks>-component
 */
@Injectable()
export class OutletService {
  private renderer: Renderer2;
  private finalSettings: DynamicHooksGlobalSettings;

  constructor(
    @Optional() @Inject(DYNAMICHOOKS_ALLSETTINGS) private allSettings: DynamicHooksGlobalSettings[],
    @Optional() @Inject(DYNAMICHOOKS_ANCESTORSETTINGS) public ancestorSettings: DynamicHooksGlobalSettings[],
    @Optional() @Inject(DYNAMICHOOKS_MODULESETTINGS) private moduleSettings: DynamicHooksGlobalSettings,
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
   * @param injector - An optional injector to use for the dynamically-loaded components. If none is provided, the injector of the module this library is imported to is used.
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
    this.resolveSettings();
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
      // Destroy dynamic components
      for (const hookIndexEntry of Object.values(hookIndex)) {
        if (hookIndexEntry.componentRef) {
          hookIndexEntry.componentRef.destroy();
        }
      }

      // Unsubscribe from hook outputs
      for (const hook of Object.values(hookIndex)) {
        for (const sub of Object.values(hook.outputSubscriptions)) {
          if (sub) {
            sub.unsubscribe();
          }
        }
      }
    }
  }

  // ----------------------------------------------------------------------------------------------------------

  private resolveSettings(): void {
    if (!this.moduleSettings.hasOwnProperty('lazyInheritance') || this.moduleSettings.lazyInheritance === DynamicHooksInheritance.All) {
      // Make sure the options of ancestorSettings (which include current moduleSettings as last entry) are last to be merged so that they always overwrite all others
      // This is in case other settings were added to the back of allSettings after registering this module
      const ancestorOptions = this.ancestorSettings.map(ancestorSettings => ancestorSettings.hasOwnProperty('globalOptions') ? {globalOptions: ancestorSettings.globalOptions} : {});
      const allSettings = [...this.allSettings, ...ancestorOptions];

      this.finalSettings = this.mergeSettings(allSettings);
    } else if (this.moduleSettings.lazyInheritance === DynamicHooksInheritance.Linear) {
      this.finalSettings = this.mergeSettings(this.ancestorSettings);
    } else if (this.moduleSettings.lazyInheritance === DynamicHooksInheritance.None) {
      this.finalSettings = this.moduleSettings;
    } else {
      throw new Error(`Incorrect DynamicHooks inheritance configuration. Used value "${this.moduleSettings.lazyInheritance}" which is not part of DynamicHooksInheritance enum. Only "All", "Linear" and "None" enum options are allowed`);
    }
  }

  /**
   * Merges multiple settings objects, overwriting previous ones with later ones in the provided array
   *
   * @param settingsArray - The settings objects to merge
   */
  private mergeSettings(settingsArray: DynamicHooksGlobalSettings[]): DynamicHooksGlobalSettings {
    const finalSettings: DynamicHooksGlobalSettings = {};
    for (const settings of settingsArray) {
      // Parsers are simply all collected, not overwritten
      if (settings.hasOwnProperty('globalParsers')) {
        if (!finalSettings.hasOwnProperty('globalParsers')) {
          finalSettings.globalParsers = [];
        }
        for (const parserEntry of settings.globalParsers) {
          finalSettings.globalParsers.push(parserEntry);
        }
      }
      // Options are individually overwritten
      if (settings.hasOwnProperty('globalOptions')) {
        if (!finalSettings.hasOwnProperty('globalOptions')) {
          finalSettings.globalOptions = {};
        }
        for (const [optionKey, optionValue] of Object.entries(settings.globalOptions)) {
          finalSettings.globalOptions[optionKey] = optionValue;
        }
      }
    }

    return finalSettings;
  }

  /**
   * Loads the relevant outlet options
   */
  private loadOptions(options: OutletOptions): OutletOptions {
    let resolvedOptions: OutletOptions;

    // If local
    if (options) {
      resolvedOptions = this.optionsResolver.resolve(options);
    // If global
    } else if (this.finalSettings && this.finalSettings.hasOwnProperty('globalOptions')) {
      resolvedOptions = this.optionsResolver.resolve(this.finalSettings.globalOptions);
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
    } else if (this.finalSettings && this.finalSettings.hasOwnProperty('globalParsers')) {
      resolvedParsers = this.parserEntryResolver.resolve(this.finalSettings.globalParsers, injector, globalParsersBlacklist, globalParsersWhitelist);
    // If none given
    } else {
      resolvedParsers = [];
    }

    return resolvedParsers;
  }





}
