import { Inject, Injectable, Injector, Optional } from '@angular/core';
import { DynamicHooksSettings, DynamicHooksInheritance, ResolvedSettings } from './settings';
import { ParserEntryResolver } from './parserEntryResolver';
import { HookParserEntry } from './parserEntry';
import { HookParser } from '../../interfacesPublic';
import { ParseOptions, getParseOptionDefaults } from './options';

/**
 * A helper class for resolving settings object and merge potentially multiple ones from different child modules/injection contexts
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsResolver {

  constructor(
    private parserEntryResolver: ParserEntryResolver
  ) {
  }

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
  ): ResolvedSettings {
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
      finalParsers = this.parserEntryResolver.resolve(localParsers, injector);
    } else if (resolvedSettings.parsers) {
      finalParsers = this.parserEntryResolver.resolve(resolvedSettings.parsers, injector, globalParsersBlacklist, globalParsersWhitelist);
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

        mergedSettings.options = Object.assign(mergedSettings.options, settings.options);
      }
    }

    return mergedSettings;
  }

}
