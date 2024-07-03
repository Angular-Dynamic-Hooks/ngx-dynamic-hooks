/*
 * Testing API Surface of ngx-dynamic-component-hooks
 * This serves as an abstraction layer that the tests can use to access all library components, services, etc. they need.
 * It can be temporarily included in public-api.ts to make everything needed for tests publically accessible in case you want to run the tests from a parent project (with the library compiled in node_modules)
 */

// Public module resources
export { provideDynamicHooks, resetDynamicHooks, allSettings } from '../lib/dynamicHooksProviders';
export { parseHooks } from '../lib/standalone';
export { DynamicHooksSettings, DynamicHooksInheritance } from '../lib/services/settings/settings';
export { HookIndex, Hook, PreviousHookBindings, PreviousHookBinding, DynamicContentChild, OnDynamicChanges, OnDynamicMount, OnDynamicData, HookParser, HookPosition, HookValue, HookComponentData, HookBindings, ParseResult, LoadedComponent, ComponentConfig } from '../lib/interfacesPublic';
export { DynamicHooksComponent } from '../lib/components/main/dynamicHooksComponent';
export { ParseOptions, getParseOptionDefaults } from '../lib/services/settings/options';
export { HookParserEntry } from '../lib/services/settings/parserEntry';
export { StringSelectorHookParser } from '../lib/parsers/selector/string/stringSelectorHookParser';
export { ElementSelectorHookParser } from '../lib/parsers/selector/element/elementSelectorHookParser';
export { SelectorHookParserConfig } from '../lib/parsers/selector/selectorHookParserConfig';
export { DynamicHooksService } from '../lib/services/dynamicHooksService';
export { AutoPlatformService } from '../lib/services/platform/autoPlatformService';
export { DefaultPlatformService } from '../lib/services/platform/defaultPlatformService';
export { EmptyPlatformService } from '../lib/services/platform/emptyPlatformService';
export { PlatformService, PLATFORM_SERVICE } from '../lib/services/platform/platformService';
export { DataTypeEncoder } from '../lib/services/utils/dataTypeEncoder';
export { DataTypeParser } from '../lib/services/utils/dataTypeParser';
export { DeepComparer } from '../lib/services/utils/deepComparer';
export { HookFinder } from '../lib/services/utils/hookFinder';
export { regexes } from '../lib/constants/regexes';
export { matchAll } from '../lib/services/utils/utils';

// Private module resources
export { DYNAMICHOOKS_ALLSETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, DYNAMICHOOKS_PROVIDERS_REGISTERED, DYNAMICHOOKS_PROVIDERS_CHECK, DYNAMICHOOKS_MODULESETTINGS, SavedBindings} from '../lib/interfaces';
export { OptionsResolver } from '../lib/services/settings/optionsResolver';
export { ParserEntryResolver } from '../lib/services/settings/parserEntryResolver';
export { ComponentCreator } from '../lib/services/core/componentCreator';
export { ComponentUpdater } from '../lib/services/core/componentUpdater';
export { StringHookFinder } from '../lib/services/core/stringHookFinder';
export { SelectorHookParserConfigResolver } from '../lib/parsers/selector/selectorHookParserConfigResolver';
export { BindingsValueManager } from '../lib/parsers/selector/bindingsValueManager';
export { TagHookFinder } from '../lib/parsers/selector/string/tagHookFinder';
export * from '../lib/constants/core';