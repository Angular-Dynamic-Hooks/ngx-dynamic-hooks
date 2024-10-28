import { EnvironmentInjector, Injector } from '@angular/core';
import { ComponentConfig } from '../../interfacesPublic';

/**
 * Several options to configure and instantiate a `SelectorHookParser` with
 */
export interface SelectorHookParserConfig {
    /**
     * The component to be used. Can be its class or a `LazyLoadComponentConfig`.
     */
    component: ComponentConfig;

    /**
     * The name of the parser. Only required if you want to black- or whitelist it.
     */
    name?: string;

    /**
     * The selector to use to find the hook.
     */
    selector?: string;

    /**
     * A custom tag to be used for the component host element.
     */
    hostElementTag?: string;

    /**
     * Whether to use regular expressions rather than HTML/DOM-based methods to find the hook elements
     */
    parseWithRegex?: boolean;

    /**
     * Whether to allow using self-closing selector tags (`<hook/>`) in addition to enclosing tags (`<hook>...</hook>`)
     */
    allowSelfClosing?: boolean;

    /**
     * @deprecated Whether the selector is enclosing (`<hook>...</hook>`) or not (`<hook>`). Use the "allowSelfClosing" option for a more modern approach.
     */
    enclosing?: boolean;

    /**
     * The brackets to use for the selector.
     */
    bracketStyle?: {opening: string, closing: string};

    /**
     * Whether to parse inputs into data types or leave them as strings.
     */
    parseInputs?: boolean;

    /**
     * Whether to remove escaping backslashes from inputs.
     */
    unescapeStrings?: boolean;

    /**
     * The Injector to create the component with.
     */
    injector?: Injector;

    /**
     * The EnvironmentInjector to create the component with.
     */
    environmentInjector?: EnvironmentInjector;

    /**
     * A list of inputs to ignore.
     */
    inputsBlacklist?: string[];

    /**
     * A list of inputs to allow exclusively.
     */
    inputsWhitelist?: string[];

    /**
     * A list of outputs to ignore.
     */
    outputsBlacklist?: string[];

    /**
     * A list of outputs to allow exclusively.
     */
    outputsWhitelist?: string[];

    /**
     * Whether to allow the use of context object variables in inputs and outputs.
     */
    allowContextInBindings?: boolean;

    /**
     * Whether to allow calling context object functions in inputs and outputs.
     */
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
    parseWithRegex: false,
    selector: undefined,
    hostElementTag: undefined,
    injector: undefined,
    allowSelfClosing: true,
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
