import { NgModule, InjectionToken, Type, SkipSelf, Optional } from '@angular/core'; // Don't remove InjectionToken here. It will compile with a dynamic import otherwise which breaks Ng<5 support
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
import { DYNAMICHOOKS_ALLSETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, DYNAMICHOOKS_ROOTSETTINGS, DYNAMICHOOKS_MODULESETTINGS } from './interfaces';

const allSettings = [];
const allChildSettings: DynamicHooksGlobalSettings[] = [];

export function allSettingsInjectorFactory(rootSettings: DynamicHooksGlobalSettings): DynamicHooksGlobalSettings[] {
  if (rootSettings === null) {
    throw new Error('It seems you\'re trying to use ngx-dynamic-hooks without calling forRoot() on the main module first. Make sure to include this to register all needed services.');
  }
  // Clear array but keep reference
  allSettings.length = 0;

  // Repopulate with updated values
  allSettings.push(rootSettings);
  allChildSettings.forEach(childSettings => allSettings.push(childSettings));

  return allSettings;
}

@NgModule()
export class DynamicHooksChildModule {}

@NgModule({
  declarations: [
    OutletComponent
  ],
  entryComponents: [
    OutletComponent
  ],
  exports: [
    OutletComponent
  ]
})
export class DynamicHooksModule {
  // Make sure not to set the optional function signature "ModuleWithProviders<T>".
  // Angular 5's version was non-generic, so will break backwards-compatibility.
  static forRoot(rootSettings: DynamicHooksGlobalSettings, platformService?: Type<PlatformService>) /*: ModuleWithProviders<DynamicHooksModule>*/ {
    // Note: Do not put any logic into forRoot. Otherwise it will break AOT compilation with View Engine (non Ivy). It needs to be very static.
    return {
      ngModule: DynamicHooksModule,
      providers: [
        {
          provide: DYNAMICHOOKS_ALLSETTINGS,
          useFactory: allSettingsInjectorFactory,
          deps: [[new Optional(), DYNAMICHOOKS_ROOTSETTINGS]]
        },
        { provide: DYNAMICHOOKS_ROOTSETTINGS, useValue: rootSettings },
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

  static forChild(childSettings: DynamicHooksGlobalSettings) /*: ModuleWithProviders<DynamicHooksModule>*/ {
    allChildSettings.push(childSettings);
    return {
      ngModule: DynamicHooksModule,
      providers: [
        // Provide the child settings
        { provide: DYNAMICHOOKS_MODULESETTINGS, useValue: childSettings },
        {
          provide: DYNAMICHOOKS_ALLSETTINGS,
          useFactory: allSettingsInjectorFactory,
          deps: [[new Optional(), DYNAMICHOOKS_ROOTSETTINGS]]
        },
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
    allChildSettings.length = 0;
  }
}
