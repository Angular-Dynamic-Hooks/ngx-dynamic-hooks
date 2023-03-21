import { HookParserEntry } from './components/outlet/options/parserEntry';
import { OutletOptions } from './components/outlet/options/options';

export enum DynamicHooksInheritance {
    All,
    Linear,
    None
}

/**
 * The interface for the global options
 */
export interface DynamicHooksGlobalSettings {
    globalParsers?: Array<HookParserEntry>;
    globalOptions?: OutletOptions;
    lazyInheritance?: DynamicHooksInheritance;
}

