/*
 * Testing API Surface of ngx-dynamic-component-hooks
 * This serves as an abstraction layer for all testing files to request their resources from the main library
 */

// Public module resources
export { DYNAMICCOMPONENTHOOKS_GLOBALSETTINGS, DynamicComponentHooksGlobalSettings } from '../lib/globalSettings';
export { DynamicContentChild, OnDynamicChanges, OnDynamicMount, OnDynamicData, HookParser, HookPosition, HookValue, HookComponentData, HookBindings } from '../lib/interfacesPublic';
export { OutletComponent } from '../lib/components/outlet/outletComponent.c';
export { OutletOptions, outletOptionDefaults } from '../lib/components/outlet/options/options';
export { HookParserEntry } from '../lib/components/outlet/options/parserEntry';
export { GenericSelectorParser } from '../lib/parsers/genericSelector/genericSelectorParser';

// Private module resources
export { OptionsResolver } from '../lib/components/outlet/options/optionsResolver';
export { ParserEntryResolver } from '../lib/components/outlet/options/parserEntryResolver';
export { ComponentCreator } from '../lib/components/outlet/services/componentCreator';
export { ComponentUpdater } from '../lib/components/outlet/services/componentUpdater';
export { HooksReplacer } from '../lib/components/outlet/services/hooksReplacer';
export { ParserConfigResolver } from '../lib/parsers/genericSelector/config/parserConfigResolver';
export { BindingStateManager } from '../lib/parsers/genericSelector/services/bindingStateManager';
export { GenericSelectorFinder } from '../lib/parsers/genericSelector/services/genericSelectorFinder';
export { DataTypeEncoder } from '../lib/utils/dataTypeEncoder';
export { DataTypeParser } from '../lib/utils/dataTypeParser';
export { DeepComparer } from '../lib/utils/deepComparer';
export { HookFinder } from '../lib/utils/hookFinder';
export { matchAll } from '../lib/polyfills/matchAll';
