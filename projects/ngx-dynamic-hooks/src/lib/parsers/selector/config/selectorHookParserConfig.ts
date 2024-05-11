import { EnvironmentInjector, Injector } from '@angular/core';
import { ComponentConfig } from '../../../interfacesPublic';

/**
 * Several options to configure and instantiate a ComponentSelectorParser with
 */
export interface SelectorHookParserConfig {
    component: ComponentConfig;
    name?: string;
    selector?: string;
    injector?: Injector;
    environmentInjector?: EnvironmentInjector,
    enclosing?: boolean;
    bracketStyle?: {opening: string, closing: string};
    parseInputs?: boolean;
    unescapeStrings?: boolean;
    inputsBlacklist?: string[];
    inputsWhitelist?: string[];
    outputsBlacklist?: string[];
    outputsWhitelist?: string[];
    allowContextInBindings?: boolean;
    allowContextFunctionCalls?: boolean;
}

// Overwrites SelectorHookParserConfig so some values can be undefined for the defaults. If still undefined after merging with user config, throws error programmatically.
export type SelectorHookParserConfigDefaults = Omit<SelectorHookParserConfig, 'component'> & { component: ComponentConfig|undefined };

/**
 * The default values for the SelectorHookParserConfig
 */
export const selectorHookParserConfigDefaults: SelectorHookParserConfigDefaults = {
    component: undefined,
    name: undefined,
    selector: undefined,
    injector: undefined,
    enclosing: true,
    bracketStyle: {opening: '<', closing: '>'},
    parseInputs: true,
    unescapeStrings: true,
    inputsBlacklist: undefined,
    inputsWhitelist: undefined,
    outputsBlacklist: undefined,
    outputsWhitelist: undefined,
    allowContextInBindings: true,
    allowContextFunctionCalls: true
};
