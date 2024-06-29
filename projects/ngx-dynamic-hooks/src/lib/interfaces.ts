import { InjectionToken } from '@angular/core';
import { DynamicHooksSettings } from './services/settings/settings';

/**
 * Custom injector tokens that are used for varous internal communication purposes
 */
export const DYNAMICHOOKS_PROVIDERS_REGISTERED = new InjectionToken<DynamicHooksSettings[]>('Part of the standard providers of this library. Is used to check if they have been registered.');
export const DYNAMICHOOKS_PROVIDERS_CHECK = new InjectionToken<DynamicHooksSettings[]>('Inject this anywhere to check whether or not the providers of this library were loaded or not.');

export const DYNAMICHOOKS_ALLSETTINGS = new InjectionToken<DynamicHooksSettings[]>('All of the settings registered in the whole app.');
export const DYNAMICHOOKS_ANCESTORSETTINGS = new InjectionToken<DynamicHooksSettings[]>('The settings collected from all ancestor injectors');
export const DYNAMICHOOKS_MODULESETTINGS = new InjectionToken<DynamicHooksSettings>('The settings for the currently loaded module.');

export interface SavedBindings {
    inputs?: {[key: string]: RichBindingData};
    outputs?: {[key: string]: RichBindingData};
}

/**
 * A detailed information object for a single binding, containing the raw unparsed binding,
 * its parsed value and all used context variables, if any
 */
export interface RichBindingData {
    raw: string;
    parsed: boolean;
    value: any;
    boundContextVariables: {[key: string]: any};
}
