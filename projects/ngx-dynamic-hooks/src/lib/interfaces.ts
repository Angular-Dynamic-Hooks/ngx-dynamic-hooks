import { InjectionToken } from '@angular/core';
import { DynamicHooksGlobalSettings } from './globalSettings';

/**
 * Custom injector tokens that are used for varous internal communication purposes
 */
export const DYNAMICHOOKS_ALLSETTINGS = new InjectionToken<DynamicHooksGlobalSettings[]>('All of the settings registered in the whole app.');
export const DYNAMICHOOKS_ROOTSETTINGS = new InjectionToken<DynamicHooksGlobalSettings>('The settings for the root module.');
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
