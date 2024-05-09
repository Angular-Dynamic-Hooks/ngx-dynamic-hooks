import { NgModule, InjectionToken, Type, ModuleWithProviders, Injector, SkipSelf, Optional } from '@angular/core'; // Don't remove InjectionToken here. It will compile with a dynamic import otherwise which breaks Ng<5 support
import { OutletComponent } from './components/outlet/outletComponent.c';
import { ComponentCreator } from './components/outlet/services/componentCreator';
import { ComponentUpdater } from './components/outlet/services/componentUpdater';
import { HooksReplacer } from './components/outlet/services/hooksReplacer';
import { BindingStateManager } from './parsers/selector/services/bindingStateManager';
import { SelectorHookFinder } from './parsers/selector/services/selectorHookFinder';
import { DynamicHooksGlobalSettings } from './globalSettings';
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
import { DYNAMICHOOKS_ALLSETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, DYNAMICHOOKS_FORROOTCALLED, DYNAMICHOOKS_FORROOTCHECK, DYNAMICHOOKS_MODULESETTINGS } from './interfaces';

const allSettings: DynamicHooksGlobalSettings[] = [];

@NgModule({
  declarations: [
    OutletComponent
  ],
  exports: [
    OutletComponent
  ]
})
export class DynamicHooksModule {


  // Make sure to set the optional function signature "ModuleWithProviders<T>".
  // Note: This will break Angular 5 backwards compatibility, but enable compatibility with newer versions (13+?).
  static forRoot(rootSettings: DynamicHooksGlobalSettings, platformService?: Type<PlatformService>): ModuleWithProviders<DynamicHooksModule> {
    this.reset();
    allSettings.push(rootSettings);

    return {
      ngModule: DynamicHooksModule,
      providers: [
        { provide: DYNAMICHOOKS_FORROOTCALLED, useValue: true },
        { provide: DYNAMICHOOKS_ALLSETTINGS, useValue: allSettings },
        { provide: DYNAMICHOOKS_MODULESETTINGS, useValue: rootSettings },
        { provide: DYNAMICHOOKS_ANCESTORSETTINGS, useValue: [rootSettings] },
        { provide: PlatformService, useClass: platformService || PlatformBrowserService },
        OutletService,
        DataTypeEncoder,
        DataTypeParser,
        DeepComparer,
        HookFinder,
        // Internal services that are not part of public-api.ts
        OptionsResolver,
        ParserEntryResolver,
        ComponentCreator,
        ComponentUpdater,
        HooksReplacer,
        SelectorHookParserConfigResolver,
        BindingStateManager,
        SelectorHookFinder
      ]
    };
  }

  static forChild(childSettings: DynamicHooksGlobalSettings): ModuleWithProviders<DynamicHooksModule> {
    allSettings.push(childSettings);
    return {
      ngModule: DynamicHooksModule,
      providers: [
        {
          provide: DYNAMICHOOKS_FORROOTCHECK,
          useFactory: (forRootCalled: boolean) => {
            if (!forRootCalled) {
              throw new Error('It seems you\'re trying to use ngx-dynamic-hooks without calling forRoot() on the main module first. Make sure to include this to register all needed services.');
            }
            return true;
          },
          deps: [[new Optional(), DYNAMICHOOKS_FORROOTCALLED]]
        },
        // Provide the child settings
        { provide: DYNAMICHOOKS_MODULESETTINGS, useValue: childSettings },
        // Also add child settings to hierarchical array of child settings
        // By having itself as a dependency with SkipSelf, a circular reference is avoided as Angular will look for DYNAMICHOOKS_ANCESTORSETTINGS in the parent injector.
        // It will keep traveling injectors upwards until it finds another or just use null as the dep.
        // Also, by returning a new array reference each time, the result will only contain the direct ancestor child settings, not all child settings from every module in the app.
        // See: https://stackoverflow.com/questions/49406615/is-there-a-way-how-to-use-angular-multi-providers-from-all-multiple-levels
        {
          provide: DYNAMICHOOKS_ANCESTORSETTINGS,
          useFactory: (ancestorSettings: DynamicHooksGlobalSettings[]) => {
            return ancestorSettings ? [...ancestorSettings, childSettings] : [childSettings];
          },
          deps: [[new SkipSelf(), new Optional(), DYNAMICHOOKS_ANCESTORSETTINGS]]
        },
        // Also provice a separate instance of OutletService for the child module (root OutletService can't see child settings)
        OutletService,
      ]
    };
  }

  static reset(): void {
    allSettings.length = 0;
  }
}
