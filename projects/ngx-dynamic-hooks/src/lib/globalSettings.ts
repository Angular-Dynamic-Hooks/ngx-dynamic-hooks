import { InjectionToken } from '@angular/core';
import { HookParserEntry } from './components/outlet/options/parserEntry';
import { OutletOptions } from './components/outlet/options/options';

/**
 * A custom injector token that is used to create a global settings provider when
 * DynamicHooksModule.forRoot() is called in the root module.
 */
export const DYNAMICHOOKS_GLOBALSETTINGS = new InjectionToken<DynamicHooksGlobalSettings>('The global settings for the DynamicHooks module.');

/**
 * The interface for the global options
 */
export interface DynamicHooksGlobalSettings {
    globalParsers?: Array<HookParserEntry>;
    globalOptions?: OutletOptions;
}
