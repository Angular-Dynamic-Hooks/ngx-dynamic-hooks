import { NgModule, Type, ModuleWithProviders, SkipSelf, Optional, Provider } from '@angular/core'; // Don't remove InjectionToken here. It will compile with a dynamic import otherwise which breaks Ng<5 support
import { DynamicHooksComponent } from './components/outlet/dynamicHooksComponent';
import { DynamicHooksGlobalSettings } from './components/outlet/settings/settings';
import { DynamicHooksService } from './components/outlet/services/dynamicHooksService';
import { PlatformService } from './platform/platformService';
import { PlatformBrowserService } from './platform/platformBrowserService';
import { DYNAMICHOOKS_ALLSETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, DYNAMICHOOKS_FORROOTCALLED, DYNAMICHOOKS_FORROOTCHECK, DYNAMICHOOKS_MODULESETTINGS } from './interfaces';

const allSettings: DynamicHooksGlobalSettings[] = [];

/**
 * Configures the root settings for running the ngx-dynamic-hooks library
 *
 * @param rootSettings - Settings that all loaded DynamicHooksComponents will use
 * @param platformService - (optional) If desired, you can specify a custom platformService to use here (safe to ignore in most cases) 
 */
export const provideDynamicHooks: (rootSettings: DynamicHooksGlobalSettings, platformService?: Type<PlatformService>) => Provider[] = (rootSettings, platformService) => {
  allSettings.length = 0;
  allSettings.push(rootSettings);

  return [
    { provide: DYNAMICHOOKS_FORROOTCALLED, useValue: true },
    { provide: DYNAMICHOOKS_ALLSETTINGS, useValue: allSettings },
    { provide: DYNAMICHOOKS_MODULESETTINGS, useValue: rootSettings },
    { provide: DYNAMICHOOKS_ANCESTORSETTINGS, useValue: [rootSettings] },
    { provide: PlatformService, useClass: platformService || PlatformBrowserService }
  ];
}

/**
 * Configures optional child settings for running the ngx-dynamic-hooks library. 
 * You can use this when registering providers in lazy-loaded routes to load additional configuration
 * 
 * @param childSettings - Settings that the loaded DynamicHooksComponents of this child context will use
 */
export const provideDynamicHooksForChild: (childSettings: DynamicHooksGlobalSettings) => Provider[] = childSettings => {
  allSettings.push(childSettings);

  return [
    {
      provide: DYNAMICHOOKS_FORROOTCHECK,
      useFactory: (forRootCalled: boolean) => {
        if (!forRootCalled) {
          throw new Error('It seems you\'re trying to use ngx-dynamic-hooks without calling forRoot() on the main module first. Make sure to include this to register all needed services.');
        }
        return true;
      },
      deps: [[new Optional(), DYNAMICHOOKS_FORROOTCALLED]]
    },
    // Provide the child settings
    { provide: DYNAMICHOOKS_MODULESETTINGS, useValue: childSettings },
    // Also add child settings to hierarchical array of child settings
    // By having itself as a dependency with SkipSelf, a circular reference is avoided as Angular will look for DYNAMICHOOKS_ANCESTORSETTINGS in the parent injector.
    // It will keep traveling injectors upwards until it finds another or just use null as the dep.
    // Also, by returning a new array reference each time, the result will only contain the direct ancestor child settings, not all child settings from every module in the app.
    // See: https://stackoverflow.com/questions/49406615/is-there-a-way-how-to-use-angular-multi-providers-from-all-multiple-levels
    {
      provide: DYNAMICHOOKS_ANCESTORSETTINGS,
      useFactory: (ancestorSettings: DynamicHooksGlobalSettings[]) => {
        return ancestorSettings ? [...ancestorSettings, childSettings] : [childSettings];
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