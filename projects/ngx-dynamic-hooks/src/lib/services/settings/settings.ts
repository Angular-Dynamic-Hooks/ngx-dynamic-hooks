import { HookParserEntry } from './parserEntry';
import { HookParser } from '../../interfacesPublic';
import { ParseOptions } from './options';

export enum DynamicHooksInheritance {
    /**
     * Merges with settings from all injectors in the app.
     */
    All,

    /**
     * (Default) Only merges with settings from direct ancestor injectors (such a father and grandfather injectors, but not "uncle" injectors).
     */
    Linear,

    /**
     * Does not merge at all. Injector only uses own settings.
     */
    None
}

/**
 * The interface for users to define the global options
 */
export interface DynamicHooksSettings {

    /**
     * A list of parsers to use globally
     */
    parsers?: HookParserEntry[];

    /**
     * Options to use globally
     */
    options?: ParseOptions;

    /**
     * Used for providing child settings in child injector contexts
     */
    inheritance?: DynamicHooksInheritance;
}