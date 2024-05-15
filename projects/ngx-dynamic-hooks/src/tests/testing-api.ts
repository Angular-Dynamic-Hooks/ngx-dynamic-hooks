/*
 * Testing API Surface of ngx-dynamic-component-hooks
 * This serves as an abstraction layer that the tests can use to access all library components, services, etc. they need.
 * It can be temporarily included in public-api.ts to make everything needed for tests publically accessible in case you want to run the tests from a parent project (with the library compiled in node_modules)
 */

// Public module resources
export { provideDynamicHooks, provideDynamicHooksForChild, resetDynamicHooks, allSettings } from '../lib/dynamicHooksProviders';
export { DynamicHooksGlobalSettings, DynamicHooksInheritance } from '../lib/components/outlet/settings/settings';
export { HookIndex, Hook, PreviousHookBindings, PreviousHookBinding, DynamicContentChild, OnDynamicChanges, OnDynamicMount, OnDynamicData, HookParser, HookPosition, HookValue, HookComponentData, HookBindings, OutletParseResult, LoadedComponent } from '../lib/interfacesPublic';
export { DynamicHooksComponent } from '../lib/components/outlet/dynamicHooksComponent';
export { OutletOptions, outletOptionDefaults } from '../lib/components/outlet/settings/options';
export { HookParserEntry } from '../lib/components/outlet/settings/parserEntry';
export { SelectorHookParser } from '../lib/parsers/selector/selectorHookParser';
export { SelectorHookParserConfig } from '../lib/parsers/selector/config/selectorHookParserConfig';
export { DynamicHooksService } from '../lib/components/outlet/services/dynamicHooksService';
export { PlatformService } from '../lib/platform/platformService';
export { PlatformBrowserService } from '../lib/platform/generalPlatformService';
export { DataTypeEncoder } from '../lib/utils/dataTypeEncoder';
export { DataTypeParser } from '../lib/utils/dataTypeParser';
export { DeepComparer } from '../lib/utils/deepComparer';
export { HookFinder } from '../lib/utils/hookFinder';
export { regexes } from '../lib/utils/regexes';
export { matchAll } from '../lib/polyfills/matchAll';

// Private module resources
export { DYNAMICHOOKS_ALLSETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, DYNAMICHOOKS_PROVIDERS_REGISTERED, DYNAMICHOOKS_PROVIDERS_CHECK, DYNAMICHOOKS_MODULESETTINGS} from '../lib/interfaces';
export { OptionsResolver } from '../lib/components/outlet/settings/optionsResolver';
export { ParserEntryResolver } from '../lib/components/outlet/settings/parserEntryResolver';
export { ComponentCreator } from '../lib/components/outlet/services/componentCreator';
export { ComponentUpdater } from '../lib/components/outlet/services/componentUpdater';
export { HooksReplacer } from '../lib/components/outlet/services/hooksReplacer';
export { SelectorHookParserConfigResolver } from '../lib/parsers/selector/config/selectorHookParserConfigResolver';
export { BindingStateManager } from '../lib/parsers/selector/services/bindingStateManager';
export { SelectorHookFinder } from '../lib/parsers/selector/services/selectorHookFinder';
