import { ComponentConfig } from '../../../interfacesPublic';

/**
 * Several options to configure and instantiate a ComponentSelectorParser with
 */
export interface SelectorHookParserConfig {
    component: ComponentConfig;
    name?: string;
    selector?: string;
    injector?: any;
    enclosing?: boolean;
    bracketStyle?: {opening: string, closing: string};
    parseInputs?: boolean;
    unescapeStrings?: boolean;
    inputsBlacklist?: Array<string>;
    inputsWhitelist?: Array<string>;
    outputsBlacklist?: Array<string>;
    outputsWhitelist?: Array<string>;
    allowContextInBindings?: boolean;
    allowContextFunctionCalls?: boolean;
}

/**
 * The default values for the SelectorHookParserConfig
 */
export const selectorHookParserConfigDefaults: SelectorHookParserConfig = {
    component: undefined,
    name: undefined,
    selector: undefined,
    injector: undefined,
    enclosing: true,
    bracketStyle: {opening: '<', closing: '>'},
    parseInputs: true,
    unescapeStrings: true,
    inputsBlacklist: null,
    inputsWhitelist: null,
    outputsBlacklist: null,
    outputsWhitelist: null,
    allowContextInBindings: true,
    allowContextFunctionCalls: true
};
