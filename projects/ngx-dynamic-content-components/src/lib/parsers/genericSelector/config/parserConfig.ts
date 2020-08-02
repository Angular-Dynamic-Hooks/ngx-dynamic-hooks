import { ComponentConfig } from '../../../interfacesPublic';

/**
 * Several options to configure and instantiate a ComponentSelectorParser with
 */
export interface GenericSelectorParserConfig {
    component: ComponentConfig;
    name?: string;
    selector?: string;
    injector?: any;
    multiTag?: boolean;
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
 * The default values for the GenericParserConfig
 */
export const genericSelectorParserConfigDefaults: GenericSelectorParserConfig = {
    component: undefined,
    name: undefined,
    selector: undefined,
    injector: undefined,
    multiTag: true,
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
