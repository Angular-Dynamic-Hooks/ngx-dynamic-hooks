import { Inject, Injectable, Injector, Optional } from '@angular/core';
import { OutletOptions, outletOptionDefaults } from './options';
import { DynamicHooksGlobalSettings, DynamicHooksInheritance, ResolvedSettings } from './settings';
import { DYNAMICHOOKS_ALLSETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, DYNAMICHOOKS_MODULESETTINGS } from '../../../interfaces';
import { ParserEntryResolver } from './parserEntryResolver';
import { OptionsResolver } from './optionsResolver';
import { HookParserEntry } from './parserEntry';
import { HookParser } from '../../../interfacesPublic';

/**
 * A helper class for resolving settings object and merge potentially multiple ones from different child modules/injection contexts
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsResolver {

  constructor(
    private injector: Injector,
    private parserEntryResolver: ParserEntryResolver,
    private optionsResolver: OptionsResolver
  ) {
  }

  public resolve(
    allSettings: DynamicHooksGlobalSettings[],
    ancestorSettings: DynamicHooksGlobalSettings[],
    moduleSettings: DynamicHooksGlobalSettings, 
    localParsers: HookParserEntry[]|null = null, 
    localOptions: OutletOptions|null = null,
    globalParsersBlacklist: string[]|null = null,
    globalParsersWhitelist: string[]|null = null,
    injector: Injector|null = null
  ): ResolvedSettings {
    let resolvedSettings: DynamicHooksGlobalSettings = {};

    if (!moduleSettings.hasOwnProperty('lazyInheritance') || moduleSettings.lazyInheritance === DynamicHooksInheritance.All) {
      // Make sure the options of ancestorSettings (which include current moduleSettings as last entry) are last to be merged so that they always overwrite all others
      // This is in case other settings were added to the back of allSettings after registering this module
      const ancestorOptions = ancestorSettings.map(ancestorSettings => ancestorSettings.hasOwnProperty('globalOptions') ? {globalOptions: ancestorSettings.globalOptions} : {});
      resolvedSettings = this.mergeSettings([...allSettings, ...ancestorOptions]);

    } else if (moduleSettings.lazyInheritance === DynamicHooksInheritance.Linear) {
      resolvedSettings = this.mergeSettings(ancestorSettings);

    } else if (moduleSettings.lazyInheritance === DynamicHooksInheritance.None) {
      resolvedSettings = moduleSettings;
      
    } else {
      throw new Error(`Incorrect DynamicHooks inheritance configuration. Used value "${moduleSettings.lazyInheritance}" which is not part of DynamicHooksInheritance enum. Only "All", "Linear" and "None" enum options are allowed`);
    }

    const resolvedParsers = this.resolveParsers(resolvedSettings.globalParsers || null, localParsers, injector || this.injector, globalParsersBlacklist, globalParsersWhitelist);
    const resolvedOptions = this.resolveOptions(resolvedSettings.globalOptions || null, localOptions);

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
  private mergeSettings(settingsArray: DynamicHooksGlobalSettings[]): DynamicHooksGlobalSettings {
    const mergedSettings: DynamicHooksGlobalSettings = {};

    for (const settings of settingsArray) {
      // Parsers are simply all collected, not overwritten
      if (settings.globalParsers !== undefined) {
        if (mergedSettings.globalParsers === undefined) {
          mergedSettings.globalParsers = [];
        }
        for (const parserEntry of settings.globalParsers) {
          mergedSettings.globalParsers.push(parserEntry);
        }
      }
      // Options are individually overwritten
      if (settings.globalOptions !== undefined) {
        if (mergedSettings.globalOptions === undefined) {
          mergedSettings.globalOptions = {};
        }

        mergedSettings.globalOptions = Object.assign(mergedSettings.globalOptions, settings.globalOptions);
      }
    }

    return mergedSettings;
  }

  /**
   * Loads the relevant outlet options
   */
  private resolveOptions(globalOptions: OutletOptions|null, localOptions: OutletOptions|null): OutletOptions {
    let resolvedOptions: OutletOptions;

    // If local
    if (localOptions) {
      resolvedOptions = this.optionsResolver.resolve(localOptions);
    // If global
    } else if (globalOptions) {
      resolvedOptions = this.optionsResolver.resolve(globalOptions);
    // If none given
    } else {
      resolvedOptions = outletOptionDefaults;
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
