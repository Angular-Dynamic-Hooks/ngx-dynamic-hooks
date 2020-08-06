import { InjectionToken } from '@angular/core';
import { HookParserEntry } from './components/outlet/options/parserEntry';
import { OutletOptions } from './components/outlet/options/options';

// Create a custom injector token that will be used to create a global settings provider
// when DynamicComponentHooksModule.forRoot() is call in the root module.
// In forRoot(), the user can configure the global settings for this module.
// When the app runs, this provider will be injected into OutletComponent to read those settings.
export const DYNAMICCOMPONENTHOOKS_GLOBALSETTINGS = new InjectionToken<DynamicComponentHooksGlobalSettings>('The global settings for the DynamicComponentHooks module.');

export interface DynamicComponentHooksGlobalSettings {
    globalParsers?: Array<HookParserEntry>;
    globalOptions?: OutletOptions;
}
