import { InjectionToken } from '@angular/core';
import { HookParserEntry } from './components/outlet/options/parserEntry';
import { OutletOptions } from './components/outlet/options/options';

/**
 * A custom injector token that is used to create a global settings provider when
 * DynamicComponentHooksModule.forRoot() is called in the root module.
 */
export const DYNAMICCOMPONENTHOOKS_GLOBALSETTINGS = new InjectionToken<DynamicComponentHooksGlobalSettings>('The global settings for the DynamicComponentHooks module.');

/**
 * The interface for the global options
 */
export interface DynamicComponentHooksGlobalSettings {
    globalParsers?: Array<HookParserEntry>;
    globalOptions?: OutletOptions;
}
