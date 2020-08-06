import { HookParser } from '../../../interfacesPublic';
import { GenericSelectorParserConfig } from '../../../parsers/genericSelector/config/parserConfig';

export type HookParserEntry = HookParser | (new(...args: any[]) => HookParser) | GenericSelectorParserConfig;
