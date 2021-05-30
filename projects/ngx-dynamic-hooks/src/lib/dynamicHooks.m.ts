import { NgModule, InjectionToken, Type } from '@angular/core'; // Don't remove InjectionToken here. It will compile with a dynamic import otherwise which breaks Ng<5 support
import { OutletComponent } from './components/outlet/outletComponent.c';
import { ComponentCreator } from './components/outlet/services/componentCreator';
import { ComponentUpdater } from './components/outlet/services/componentUpdater';
import { HooksReplacer } from './components/outlet/services/hooksReplacer';
import { BindingStateManager } from './parsers/selector/services/bindingStateManager';
import { SelectorHookFinder } from './parsers/selector/services/selectorHookFinder';
import { DYNAMICHOOKS_GLOBALSETTINGS, DynamicHooksGlobalSettings } from './globalSettings';
import { DataTypeEncoder } from './utils/dataTypeEncoder';
import { DataTypeParser } from './utils/dataTypeParser';
import { DeepComparer } from './utils/deepComparer';
import { HookFinder } from './utils/hookFinder';
import { OptionsResolver } from './components/outlet/options/optionsResolver';
import { ParserEntryResolver } from './components/outlet/options/parserEntryResolver';
import { SelectorHookParserConfigResolver } from './parsers/selector/config/selectorHookParserConfigResolver';
import { OutletService } from './components/outlet/services/outletService';
import { PlatformService } from './platform/platformService';
import { PlatformBrowserService } from './platform/platformBrowserService';

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
    SelectorHookParserConfigResolver,
    BindingStateManager,
    SelectorHookFinder
  ]
})
export class DynamicHooksModule {
  // Make sure not to set the optional function signature "ModuleWithProviders<T>".
  // Angular 5's version was non-generic, so will break backwards-compatibility.
  static forRoot(globalSettings: DynamicHooksGlobalSettings, platformService?: Type<PlatformService>) /*: ModuleWithProviders<DynamicHooksModule>*/ {
    return {
      ngModule: DynamicHooksModule,
      providers: [
        // Put app-wide services here
        { provide: DYNAMICHOOKS_GLOBALSETTINGS, useValue: globalSettings },
        OutletService,
        DataTypeEncoder,
        DataTypeParser,
        DeepComparer,
        HookFinder,
        { provide: PlatformService, useClass: platformService || PlatformBrowserService }
      ]
    };
  }
}
