import { Type, SkipSelf, Optional, Provider, APP_INITIALIZER, Injectable, OnDestroy } from '@angular/core'; // Don't remove InjectionToken here. It will compile with a dynamic import otherwise which breaks Ng<5 support
import { DynamicHooksSettings } from './services/settings/settings';
import { DynamicHooksService } from './services/dynamicHooksService';
import { PLATFORM_SERVICE, PlatformService } from './services/platform/platformService';
import { DYNAMICHOOKS_ALLSETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, DYNAMICHOOKS_MODULESETTINGS, DYNAMICHOOKS_PROVIDERS_REGISTERED } from './interfaces';
import { HookParserEntry } from './services/settings/parserEntry';
import { EmptyPlatformService } from './services/platform/emptyPlatformService';

export const allSettings: DynamicHooksSettings[] = [];

/**
 * Configures the root settings for running the ngx-dynamic-hooks library
 *
 * @param rootSettings - Settings that all loaded DynamicHooksComponents will use
 * @param platformService - (optional) If desired, you can specify a custom platformService to use here (safe to ignore in most cases) 
 */
export const provideDynamicHooks: (rootSettings: DynamicHooksSettings|HookParserEntry[], platformService?: Type<PlatformService>) => Provider[] = (rootSettings, platformService) => {
  const settings: DynamicHooksSettings = Array.isArray(rootSettings) ? {parsers: rootSettings} : rootSettings;

  allSettings.push(settings);
  
  return [
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      multi: true,
      deps: [DynamicHooksInitService]
    },
    { provide: DYNAMICHOOKS_PROVIDERS_REGISTERED, useValue: true },
    { provide: DYNAMICHOOKS_ALLSETTINGS, useValue: allSettings },
    { provide: DYNAMICHOOKS_MODULESETTINGS, useValue: settings },
    { provide: DYNAMICHOOKS_ANCESTORSETTINGS, useValue: [settings] },
    { provide: PLATFORM_SERVICE, useClass: platformService || EmptyPlatformService }
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
    // Reset allSettings on app close for the benefit of vite live reloads and tests (does not destroy allSettings reference between app reloads)
    // Safer to do this only on app close rather than on app start (in provideDynamicHooks), as this allows you to call provideDynamicHooksForChild before provideDynamicHooks
    // without losing the child settings
    allSettings.length = 0;
  }
}

/**
 * Configures optional child settings for running the ngx-dynamic-hooks library. 
 * You can use this when registering providers in lazy-loaded routes to load additional configuration
 * 
 * @param childSettings - Settings that the loaded DynamicHooksComponents of this child context will use
 */
export const provideDynamicHooksForChild: (childSettings: DynamicHooksSettings|HookParserEntry[]) => Provider[] = childSettings => {
  const settings: DynamicHooksSettings = Array.isArray(childSettings) ? {parsers: childSettings} : childSettings;

  allSettings.push(settings);

  return [
    // Provide the child settings
    { provide: DYNAMICHOOKS_MODULESETTINGS, useValue: settings },
    // Also add child settings to hierarchical array of child settings
    // By having itself as a dependency with SkipSelf, a circular reference is avoided as Angular will look for DYNAMICHOOKS_ANCESTORSETTINGS in the parent injector.
    // It will keep traveling injectors upwards until it finds another or just use null as the dep.
    // Also, by returning a new array reference each time, the result will only contain the direct ancestor child settings, not all child settings from every module in the app.
    // See: https://stackoverflow.com/questions/49406615/is-there-a-way-how-to-use-angular-multi-providers-from-all-multiple-levels
    {
      provide: DYNAMICHOOKS_ANCESTORSETTINGS,
      useFactory: (ancestorSettings: DynamicHooksSettings[]) => {
        return ancestorSettings ? [...ancestorSettings, settings] : [settings];
      },
      deps: [[new SkipSelf(), new Optional(), DYNAMICHOOKS_ANCESTORSETTINGS]]
    },
    // Must provide a separate instance of DynamicHooksService for each child module (so gets injected module-specific "ModuleSettings", not root settings)
    DynamicHooksService
  ];
}


export const resetDynamicHooks: () => void = () => {
  allSettings.length = 0;
}