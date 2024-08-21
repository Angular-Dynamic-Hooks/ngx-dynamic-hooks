import { Inject, Injectable, Injector, Optional } from '@angular/core';
import { DynamicHooksSettings, DynamicHooksInheritance } from './settings';
import { ParserEntryResolver } from './parserEntryResolver';
import { HookParserEntry } from './parserEntry';
import { HookParser } from '../../interfacesPublic';
import { ParseOptions, getParseOptionDefaults } from './options';

/**
 * A helper class for resolving a combined settings object from all provided ones
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsResolver {

  constructor(
    private parserEntryResolver: ParserEntryResolver
  ) {
  }

  /**
   * Takes all provided settings objects and combines them into a final settings object
   * 
   * @param injector - The current injector
   * @param content - The content
   * @param allSettings - All settings provided anywhere
   * @param ancestorSettings - All ancestor settings
   * @param moduleSettings - The current module settings
   * @param localParsers - A list of local parsers
   * @param localOptions - A local options object
   * @param globalParsersBlacklist - A list of global parsers to blacklist
   * @param globalParsersWhitelist - A list of global parsers to whitelist
   */
  public resolve(
    injector: Injector,
    content: any,
    allSettings: DynamicHooksSettings[]|null,
    ancestorSettings: DynamicHooksSettings[]|null,
    moduleSettings: DynamicHooksSettings|null, 
    localParsers: HookParserEntry[]|null = null, 
    localOptions: ParseOptions|null = null,
    globalParsersBlacklist: string[]|null = null,
    globalParsersWhitelist: string[]|null = null,
  ): {
    parsers: HookParser[];
    options: ParseOptions;
  } {
    let resolvedSettings: DynamicHooksSettings = {};
    allSettings = allSettings || [];
    ancestorSettings = ancestorSettings || [];
    moduleSettings = moduleSettings || {};
    const defaultSettings: DynamicHooksSettings = { options: getParseOptionDefaults() };

    // Merge settings according to inheritance
    if (!moduleSettings.hasOwnProperty('inheritance') || moduleSettings.inheritance === DynamicHooksInheritance.Linear) {
      resolvedSettings = this.mergeSettings([
        defaultSettings,
        ...ancestorSettings,
        {parsers: localParsers || undefined, options: localOptions || undefined}
      ]);

    } else if (moduleSettings.inheritance === DynamicHooksInheritance.All) {
      // Additionally merge ancestorSettings after allSettings to give settings closer to the current injector priority
      resolvedSettings = this.mergeSettings([
        defaultSettings,
        ...allSettings, 
        ...ancestorSettings,
        {options: localOptions || undefined}
      ]);

    } else {
      resolvedSettings = this.mergeSettings([
        defaultSettings,
        moduleSettings || {},
        {options: localOptions || undefined}
      ])  
    }

    const finalOptions = resolvedSettings.options!;

    // Disabled sanitization if content is not string
    if (content && typeof content !== 'string') {
      finalOptions.sanitize = false;
  }
    
    // Process parsers entries. Local parsers fully replace global ones.
    let finalParsers: HookParser[] = [];
    if (localParsers) {
      finalParsers = this.parserEntryResolver.resolve(localParsers, injector, null, null, finalOptions);
    } else if (resolvedSettings.parsers) {
      finalParsers = this.parserEntryResolver.resolve(resolvedSettings.parsers, injector, globalParsersBlacklist, globalParsersWhitelist, finalOptions);
    }

    return {
      parsers: finalParsers,
      options: finalOptions
    };
  }

  /**
   * Merges multiple settings objects, overwriting previous ones with later ones in the provided array
   *
   * @param settingsArray - The settings objects to merge
   */
  private mergeSettings(settingsArray: DynamicHooksSettings[]): DynamicHooksSettings {
    const mergedSettings: DynamicHooksSettings = {};

    for (const settings of settingsArray) {
      // Unique parsers are simply all collected, not overwritten
      if (settings.parsers !== undefined) {
        if (mergedSettings.parsers === undefined) {
          mergedSettings.parsers = [];
        }
        for (const parserEntry of settings.parsers) {
          if (!mergedSettings.parsers.includes(parserEntry)) {
            mergedSettings.parsers.push(parserEntry);
          }
        }
      }
      // Options are individually overwritten
      if (settings.options !== undefined) {
        if (mergedSettings.options === undefined) {
          mergedSettings.options = {};
        }

        mergedSettings.options = this.recursiveAssign(mergedSettings.options, settings.options);
      }
    }

    return mergedSettings;
  }

  /**
   * Recursively merges two objects
   * 
   * @param a - The target object to merge into
   * @param b - The other object being merged
   */
  private recursiveAssign (a: any, b: any) {
    if (Object(b) !== b) return b;
    if (Object(a) !== a) a = {};
    for (const key in b) {
        a[key] = this.recursiveAssign(a[key], b[key]);
    }
    return a;
  }

}
