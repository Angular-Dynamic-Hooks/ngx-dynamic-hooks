import { Inject, Injectable, Injector, Optional } from '@angular/core';
import { DynamicHooksSettings, DynamicHooksInheritance, ResolvedSettings } from './settings';
import { ParserEntryResolver } from './parserEntryResolver';
import { OptionsResolver } from './optionsResolver';
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
    private parserEntryResolver: ParserEntryResolver,
    private optionsResolver: OptionsResolver
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

    if (!moduleSettings.hasOwnProperty('inheritance') || moduleSettings.inheritance === DynamicHooksInheritance.All) {
      // Make sure the options of ancestorSettings (which include current moduleSettings as last entry) are last to be merged so that they always overwrite all others
      // This is in case other settings were added to the back of allSettings after registering this module
      resolvedSettings = this.mergeSettings([...allSettings, ...ancestorSettings]);

    } else if (moduleSettings.inheritance === DynamicHooksInheritance.Linear) {
      resolvedSettings = this.mergeSettings(ancestorSettings);

    } else {
      resolvedSettings = moduleSettings || {};
  
    }

    const resolvedParsers = this.resolveParsers(resolvedSettings.parsers || null, localParsers, injector, globalParsersBlacklist, globalParsersWhitelist);
    const resolvedOptions = this.resolveOptions(content, resolvedSettings.options || null, localOptions);

    return {
      parsers: resolvedParsers,
      options: resolvedOptions
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

  /**
   * Loads the relevant parse options
   */
  private resolveOptions(content: any, globalOptions: ParseOptions|null, localOptions: ParseOptions|null): ParseOptions {
    let resolvedOptions: ParseOptions;

    // If local
    if (localOptions) {
      resolvedOptions = this.optionsResolver.resolve(content, localOptions);
    // If global
    } else if (globalOptions) {
      resolvedOptions = this.optionsResolver.resolve(content, globalOptions);
    // If none given
    } else {
      resolvedOptions = getParseOptionDefaults(content);
    }

    return resolvedOptions;
  }

  /**
   * Loads the relevant parser configuration
   */
  private resolveParsers(globalParsers: HookParserEntry[]|null, localParsers: HookParserEntry[]|null, injector: Injector, globalParsersBlacklist: string[]|null, globalParsersWhitelist: string[]|null): Array<HookParser> {
    let resolvedParsers: Array<HookParser>;

    // If local
    if (localParsers) {
      resolvedParsers = this.parserEntryResolver.resolve(localParsers, injector);
    // If global
    } else if (globalParsers) {
      resolvedParsers = this.parserEntryResolver.resolve(globalParsers, injector, globalParsersBlacklist, globalParsersWhitelist);
    // If none given
    } else {
      resolvedParsers = [];
    }

    return resolvedParsers;
  }
}
