import { NgModule, ModuleWithProviders } from '@angular/core';
import { OutletComponent } from './components/dynamicHooks/outletComponent.c';
import { ComponentCreator } from './components/dynamicHooks/services/componentCreator';
import { ComponentUpdater } from './components/dynamicHooks/services/componentUpdater';
import { HooksReplacer } from './components/dynamicHooks/services/hooksReplacer';
import { BindingStateManager } from './parsers/genericSelector/services/bindingStateManager';
import { GenericSelectorFinder } from './parsers/genericSelector/services/genericSelectorFinder';
import { DYNAMICCONTENTCOMPONENTS_GLOBALSETTINGS, DynamicContentComponentsGlobalSettings } from './globalSettings';
import { DataTypeEncoder } from './utils/dataTypeEncoder';
import { DataTypeParser } from './utils/dataTypeParser';
import { DeepComparer } from './utils/deepComparer';
import { HookFinder } from './utils/hookFinder';

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
    ComponentCreator,
    ComponentUpdater,
    HooksReplacer,
    BindingStateManager,
    GenericSelectorFinder
  ]
})
export class DynamicContentComponentsModule {
  static forRoot(globals: DynamicContentComponentsGlobalSettings): ModuleWithProviders<DynamicContentComponentsModule> {
    return {
      ngModule: DynamicContentComponentsModule,
      providers: [
        // Put app-wide services here
        { provide: DYNAMICCONTENTCOMPONENTS_GLOBALSETTINGS, useValue: globals },
        DataTypeEncoder,
        DataTypeParser,
        DeepComparer,
        HookFinder
      ]
    };
  }
 }
