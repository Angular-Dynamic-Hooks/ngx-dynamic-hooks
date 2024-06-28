import { HookParser } from '../../interfacesPublic';
import { SelectorHookParserConfig } from '../../parsers/selector/selectorHookParserConfig';

/**
 * An configuration entry for a HookParser. This can either be:
 *
 * 1. A SelectorHookParserConfig, which sets up an intance of SelectorHookParser quickly
 * 2. A custom HookParser instance
 * 3. A custom HookParser class. If this class is registered as a provider/service in the root injector, it will be injected,
 *    otherwise it will be manually instantiated without constructor arguments.
 *
 */
export type HookParserEntry = (new(...args: any[]) => any) | SelectorHookParserConfig | HookParser;
