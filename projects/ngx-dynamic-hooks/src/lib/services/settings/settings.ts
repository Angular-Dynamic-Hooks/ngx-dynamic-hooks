import { HookParserEntry } from './parserEntry';
import { HookParser } from '../../interfacesPublic';
import { ParseOptions } from './options';

export enum DynamicHooksInheritance {
    All,
    Linear,
    None
}

/**
 * The interface for users to define the global options
 */
export interface DynamicHooksSettings {
    parsers?: HookParserEntry[];
    options?: ParseOptions;
    inheritance?: DynamicHooksInheritance;
}

/**
 * Represents fully resolved settings for a single parsing context
 */
export interface ResolvedSettings {
    parsers: HookParser[];
    options: ParseOptions;
}