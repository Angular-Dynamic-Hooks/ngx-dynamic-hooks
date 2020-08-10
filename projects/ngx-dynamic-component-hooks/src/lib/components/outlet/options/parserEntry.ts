import { HookParser } from '../../../interfacesPublic';
import { GenericSelectorParserConfig } from '../../../parsers/genericSelector/config/parserConfig';

/**
 * An configuration entry for a HookParser. This can either be:
 *
 * 1. A GenericSelectorParserConfig, which sets up an intance of GenericSelectorParser quickly
 * 2. A custom HookParser instance
 * 3. A custom HookParser class. If this class is registered as a provider/service in the root injector, it will be injected,
 *    otherwise it will be manually instantiated without constructor arguments.
 *
 */
export type HookParserEntry = GenericSelectorParserConfig | HookParser | (new(...args: any[]) => HookParser);
