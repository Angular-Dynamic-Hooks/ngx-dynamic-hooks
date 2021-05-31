/*
 * Testing API Surface of ngx-dynamic-component-hooks
 * This serves as an abstraction layer for all testing files to request their resources from the main library
 */

// Public module resources
export { DYNAMICHOOKS_GLOBALSETTINGS, DynamicHooksGlobalSettings } from '../lib/globalSettings';
export { HookIndex, Hook, PreviousHookBindings, PreviousHookBinding, DynamicContentChild, OnDynamicChanges, OnDynamicMount, OnDynamicData, HookParser, HookPosition, HookValue, HookComponentData, HookBindings, OutletParseResult, LoadedComponent } from '../lib/interfacesPublic';
export { OutletComponent } from '../lib/components/outlet/outletComponent.c';
export { OutletOptions, outletOptionDefaults } from '../lib/components/outlet/options/options';
export { HookParserEntry } from '../lib/components/outlet/options/parserEntry';
export { SelectorHookParser } from '../lib/parsers/selector/selectorHookParser';
export { PlatformService } from '../lib/platform/platformService';
export { DynamicHooksModule } from '../lib/dynamicHooks.m';

// Private module resources
export { OptionsResolver } from '../lib/components/outlet/options/optionsResolver';
export { ParserEntryResolver } from '../lib/components/outlet/options/parserEntryResolver';
export { ComponentCreator } from '../lib/components/outlet/services/componentCreator';
export { ComponentUpdater } from '../lib/components/outlet/services/componentUpdater';
export { HooksReplacer } from '../lib/components/outlet/services/hooksReplacer';
export { SelectorHookParserConfigResolver } from '../lib/parsers/selector/config/selectorHookParserConfigResolver';
export { BindingStateManager } from '../lib/parsers/selector/services/bindingStateManager';
export { SelectorHookFinder } from '../lib/parsers/selector/services/selectorHookFinder';
export { DataTypeEncoder } from '../lib/utils/dataTypeEncoder';
export { DataTypeParser } from '../lib/utils/dataTypeParser';
export { DeepComparer } from '../lib/utils/deepComparer';
export { HookFinder } from '../lib/utils/hookFinder';
export { OutletService } from '../lib/components/outlet/services/outletService';
export { PlatformBrowserService } from '../lib/platform/platformBrowserService';

export { matchAll } from '../lib/polyfills/matchAll';
