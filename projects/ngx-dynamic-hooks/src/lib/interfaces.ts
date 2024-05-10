import { InjectionToken } from '@angular/core';
import { DynamicHooksGlobalSettings } from './components/outlet/settings/settings';

/**
 * Custom injector tokens that are used for varous internal communication purposes
 */
export const DYNAMICHOOKS_FORROOTCALLED = new InjectionToken<DynamicHooksGlobalSettings[]>('A provider that is set in forRoot, so forChild can see if forRoot was called first');
export const DYNAMICHOOKS_FORROOTCHECK = new InjectionToken<DynamicHooksGlobalSettings[]>('Inject this anywhere to check whether or not forRoot was called and throw an error if not');
export const DYNAMICHOOKS_ALLSETTINGS = new InjectionToken<DynamicHooksGlobalSettings[]>('All of the settings registered in the whole app.');
export const DYNAMICHOOKS_ANCESTORSETTINGS = new InjectionToken<DynamicHooksGlobalSettings[]>('The settings collected from all ancestor injectors');
export const DYNAMICHOOKS_MODULESETTINGS = new InjectionToken<DynamicHooksGlobalSettings>('The settings for the currently loaded module.');

/**
 * A detailed information object for a single binding, containing the raw unparsed binding,
 * its parsed value and all used context variables, if any
 */
export interface RichBindingData {
    raw: string;
    value: any;
    boundContextVariables: {[key: string]: any};
}
