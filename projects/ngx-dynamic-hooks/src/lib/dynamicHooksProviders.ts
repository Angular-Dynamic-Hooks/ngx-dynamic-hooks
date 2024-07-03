import { Type, SkipSelf, Optional, Provider, APP_INITIALIZER, Injectable, OnDestroy } from '@angular/core'; // Don't remove InjectionToken here. It will compile with a dynamic import otherwise which breaks Ng<5 support
import { DynamicHooksSettings } from './services/settings/settings';
import { DynamicHooksService } from './services/dynamicHooksService';
import { PLATFORM_SERVICE, PlatformService } from './services/platform/platformService';
import { DYNAMICHOOKS_ALLSETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, DYNAMICHOOKS_MODULESETTINGS, DYNAMICHOOKS_PROVIDERS_REGISTERED } from './interfaces';
import { HookParserEntry } from './services/settings/parserEntry';
import { EmptyPlatformService } from './services/platform/emptyPlatformService';

export const allSettings: DynamicHooksSettings[] = [];

/**
 * Configures the global settings for running the ngx-dynamic-hooks library
 *
 * @param rootSettings - Settings that all loaded DynamicHooksComponents will use
 * @param platformService - (optional) If desired, you can specify a custom platformService to use here (safe to ignore in most cases) 
 */
export const provideDynamicHooks: (rootSettings?: DynamicHooksSettings|HookParserEntry[], platformService?: Type<PlatformService>) => Provider[] = (rootSettings, platformService) => {
  const settings: DynamicHooksSettings|undefined = Array.isArray(rootSettings) ? {parsers: rootSettings} : rootSettings;

  if (settings !== undefined) {
    allSettings.push(settings);
  }
  
  return [
    // General providers
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      multi: true,
      deps: [DynamicHooksInitService]
    },
    { provide: DYNAMICHOOKS_PROVIDERS_REGISTERED, useValue: true },
    { provide: PLATFORM_SERVICE, useClass: platformService || EmptyPlatformService },

    // Settings
    { provide: DYNAMICHOOKS_ALLSETTINGS, useValue: allSettings },
    // AncestorSettings is a hierarchical array of provided settings
    // By having itself as a dependency with SkipSelf, a circular reference is avoided as Angular will look for DYNAMICHOOKS_ANCESTORSETTINGS in the parent injector.
    // It will keep traveling injectors upwards until it finds another or just use null as the dep.
    // Also, by returning a new array reference each time, the result will only contain the direct ancestor child settings, not all child settings from every module in the app.
    // See: https://stackoverflow.com/questions/49406615/is-there-a-way-how-to-use-angular-multi-providers-from-all-multiple-levels
    {
      provide: DYNAMICHOOKS_ANCESTORSETTINGS,
      useFactory: (ancestorSettings: DynamicHooksSettings[]) => {
        ancestorSettings = Array.isArray(ancestorSettings) ? ancestorSettings : [];
        ancestorSettings = settings !== undefined ? [...ancestorSettings, settings] : ancestorSettings;
        return ancestorSettings;
      },
      deps: [[new SkipSelf(), new Optional(), DYNAMICHOOKS_ANCESTORSETTINGS]]
    },
    { provide: DYNAMICHOOKS_MODULESETTINGS, useValue: settings },

    // Must provide a separate instance of DynamicHooksService each time you call provideDynamicHooks, 
    // so it can see passed settings of this level
    DynamicHooksService
    
  ];
}

/**
 * A service that will always be created on app init, even without using a DynamicHooksComponent
 */
@Injectable({
  providedIn: 'root'
})
export class DynamicHooksInitService implements OnDestroy {
  ngOnDestroy(): void {
    // Reset allSettings on app close for the benefit of vite live reloads and tests (which does not destroy allSettings reference between app reloads)
    // Safer to do this only on app close rather than on app start as it acts like a cleanup function and the order of execution matters less
    allSettings.length = 0;
  }
}

export const resetDynamicHooks: () => void = () => {
  allSettings.length = 0;
}