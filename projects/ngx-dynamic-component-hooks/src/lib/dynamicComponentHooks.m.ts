import { NgModule, InjectionToken } from '@angular/core'; // Don't remove InjectionToken here. It will compile with a dynamic import otherwise which breaks Ng<5 support
import { OutletComponent } from './components/outlet/outletComponent.c';
import { ComponentCreator } from './components/outlet/services/componentCreator';
import { ComponentUpdater } from './components/outlet/services/componentUpdater';
import { HooksReplacer } from './components/outlet/services/hooksReplacer';
import { BindingStateManager } from './parsers/genericSelector/services/bindingStateManager';
import { GenericSelectorFinder } from './parsers/genericSelector/services/genericSelectorFinder';
import { DYNAMICCOMPONENTHOOKS_GLOBALSETTINGS, DynamicComponentHooksGlobalSettings } from './globalSettings';
import { DataTypeEncoder } from './utils/dataTypeEncoder';
import { DataTypeParser } from './utils/dataTypeParser';
import { DeepComparer } from './utils/deepComparer';
import { HookFinder } from './utils/hookFinder';
import { OptionsResolver } from './components/outlet/options/optionsResolver';
import { ParserEntryResolver } from './components/outlet/options/parserEntryResolver';
import { ParserConfigResolver } from './parsers/genericSelector/config/parserConfigResolver';

@NgModule({
  declarations: [
    OutletComponent
  ],
  entryComponents: [
    OutletComponent
  ],
  exports: [
    OutletComponent
  ],
  providers: [
    // Put module-wide services here
    OptionsResolver,
    ParserEntryResolver,
    ComponentCreator,
    ComponentUpdater,
    HooksReplacer,
    ParserConfigResolver,
    BindingStateManager,
    GenericSelectorFinder
  ]
})
export class DynamicComponentHooksModule {
  // Make sure not to set the optional function signature "ModuleWithProviders<T>".
  // Angular 5's version was non-generic, so will break backwards-compatibility.
  static forRoot(globalSettings: DynamicComponentHooksGlobalSettings)/*: ModuleWithProviders<DynamicComponentHooksModule>*/ {
    return {
      ngModule: DynamicComponentHooksModule,
      providers: [
        // Put app-wide services here
        { provide: DYNAMICCOMPONENTHOOKS_GLOBALSETTINGS, useValue: globalSettings },
        DataTypeEncoder,
        DataTypeParser,
        DeepComparer,
        HookFinder
      ]
    };
  }
 }