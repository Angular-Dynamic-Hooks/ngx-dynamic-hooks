import { HookParser } from '../../interfacesPublic';
import { SelectorHookParserConfig } from '../../parsers/selector/selectorHookParserConfig';

/**
 * An configuration entry for a HookParser. This can either be:
 *
 *  1. The component class itself.
 *  2. A SelectorHookParserConfig object literal.
 *  3. A custom HookParser instance.
 *  4. A custom HookParser class. If this class is available as a provider/service, it will be injected.
 */
export type HookParserEntry = (new(...args: any[]) => any) | SelectorHookParserConfig | HookParser;
