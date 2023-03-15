import { ElementRef, Injector } from '@angular/core';
import { TestBed, ComponentFixtureAutoDetect, TestBedStatic, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { DomSanitizer } from '@angular/platform-browser';

import { first } from 'rxjs/operators';

// Importing files through testing-api file here instead of their own paths.
// This way, we can add easily add the testing-api file as an import to public-api if we want to
// temporarily grant access to all testing resources in the final build. This is useful for testing this
// library with different ng-versions, as it allows us to run the tests from the ng-app against a
// compiled version of this library (by copying this spec-file over) instead of the uncompiled version here.
// There is also no other way to test libraries with older ng-versions, as packagr did not exist back then.

// Testing api resources
import { DYNAMICHOOKS_GLOBALSETTINGS, DynamicHooksGlobalSettings, OutletComponent } from '../testing-api';
import { OutletParseResult } from '../testing-api';
import { LoadedComponent } from '../testing-api';
import { OutletOptions, outletOptionDefaults } from '../testing-api';
import { HookParserEntry } from '../testing-api';
import { SelectorHookParser } from '../testing-api';
import { PlatformService } from '../testing-api';

import { OptionsResolver } from '../testing-api';
import { ParserEntryResolver } from '../testing-api';
import { ComponentCreator } from '../testing-api';
import { ComponentUpdater } from '../testing-api';
import { HooksReplacer } from '../testing-api';
import { SelectorHookParserConfigResolver } from '../testing-api';
import { BindingStateManager } from '../testing-api';
import { SelectorHookFinder } from '../testing-api';
import { DataTypeEncoder } from '../testing-api';
import { DataTypeParser } from '../testing-api';
import { DeepComparer } from '../testing-api';
import { HookFinder } from '../testing-api';
import { OutletService } from '../testing-api';
import { PlatformBrowserService } from '../testing-api';

// Custom testing resources
import { OutletComponentWithProviders } from '../resources/components/OutletComponentWithProviders';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { InlineTestComponent } from '../resources/components/inlineTest/inlineTest.c';
import { ParentTestComponent } from '../resources/components/parentTest/parentTest.c';
import { ChildTestComponent } from '../resources/components/parentTest/childTest/childTest.c';
import { EnclosingCustomParser } from '../resources/parsers/enclosingCustomParser';
import { NgContentTestParser } from '../resources/parsers/ngContentTestParser';
import { ServiceTestParser } from '../resources/parsers/serviceTestParser';
import { NonServiceTestParser } from '../resources/parsers/nonServiceTestParser';
import { TESTSERVICETOKEN, TestService } from '../resources/services/testService';
import { NgContentTestComponent } from '../resources/components/ngContentTest/ngContentTest.c';
import { LazyTestComponent } from '../resources/components/lazyTest/lazyTest.c';

export class MockElementRef {
  nativeElement!: {};
}

// The standard parsers to be used for most tests
export const testParsers: Array<HookParserEntry> = [
  {
    component: SingleTagTestComponent,
    name: 'SingleTagTestComponentParser',
    enclosing: false
  },
  {
    component: MultiTagTestComponent,
    name: 'MultiTagTestComponentParser'
  },
  {
    component: InlineTestComponent,
    name: 'InlineTestComponentParser',
  }
];

export interface TestingModuleAndComponent {
  testBed: TestBedStatic;
  fixture: ComponentFixture<OutletComponentWithProviders>;
  comp: OutletComponentWithProviders;
}

// A simple function to reset and prepare the testing module
export function prepareTestingModule(parsers?: any, options?: any, extraComponents: Array<any> = []): TestingModuleAndComponent {
  // Generate settings
  const globalSettings: DynamicHooksGlobalSettings = {};
  if (parsers) { globalSettings.globalParsers = parsers; }
  if (options) { globalSettings.globalOptions = options; }

  // Generate declarations
  let declarations = [OutletComponentWithProviders];
  if (parsers) { declarations = declarations.concat(...parsers.filter((entry: any) => typeof entry.component === 'function').map((entry: any) => entry.component)); }
  declarations = declarations.concat(extraComponents);

  // Get all services
  const services = [
    // Main component services
    OptionsResolver,
    ParserEntryResolver,
    OutletService,
    ComponentCreator,
    ComponentUpdater,
    HooksReplacer,
    // Parser services
    SelectorHookParserConfigResolver,
    BindingStateManager,
    SelectorHookFinder,
    // Util services
    DataTypeEncoder,
    DataTypeParser,
    DeepComparer,
    HookFinder,
    // Test services
    TestService,
    // Other
    ServiceTestParser,
    EnclosingCustomParser,
    NgContentTestParser,
    // Platform
    { provide: PlatformService, useClass: PlatformBrowserService, deps: [DomSanitizer] }
  ];

  // Generate providers
  const providers: any = [
    {provide: ComponentFixtureAutoDetect, useValue: true},
    {provide: ElementRef, useClass: MockElementRef},
    ...services
  ];
  if (Object.keys(globalSettings).length > 0) {
    providers.push({
      provide: DYNAMICHOOKS_GLOBALSETTINGS,
      useValue: globalSettings
    });
  }

  // Generate entryComponents
  let entryComponents: any = [];
  if (parsers) { entryComponents = entryComponents.concat(...parsers.filter((entry: any) => typeof entry.component === 'function').map((entry: any) => entry.component)); }
  entryComponents = entryComponents.concat(extraComponents);

  // Create testing module
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    declarations,
    providers,
  }).overrideModule(BrowserDynamicTestingModule, {
    set: {
      entryComponents
    }
  });

  const fixture = TestBed.createComponent(OutletComponentWithProviders);
  return {
    testBed: TestBed,
    fixture,
    comp: fixture.componentInstance
  };
}



export interface TestingModuleComponentAndContext {
  testBed: TestBedStatic;
  fixture: ComponentFixture<OutletComponentWithProviders>;
  comp: OutletComponentWithProviders;
  context: any;
}

export function defaultBeforeEach(): TestingModuleComponentAndContext {
    const {testBed, fixture, comp} = prepareTestingModule(testParsers);
    const context = {
      parent: comp,
      greeting: 'Hello there!',
      order: 66,
      maneuvers: {
        modifyParent: (event: any) => (comp as any)['completelyNewProperty'] = event,
        getMentalState: () => 'angry',
        findAppropriateAction: (mentalState: any) => mentalState === 'angry' ? 'meditate' : 'protectDemocracy',
        meditate: () => { return {action:'meditating!', state: 'calm'}; },
        protectDemocracy: () => { return {action: 'hunting sith!', state: 'vigilant'}; },
        attack: (enemy: any) => 'attacking ' + enemy + '!',
        generateEnemy: (name: any) => { return {name: 'the evil ' + name, type: 'monster'}; },
        defend: (person: any) => 'defending ' + person + '!',
        readJediCode: () => 'dont fall in love with pricesses from naboo',
        goIntoExile: () => 'into exile, i must go!',
        combo: (param1: any, param2: any) => 'Combo: ' + param1 + ' and ' + param2
      },
      $lightSaberCollection: [
        'blue', 'green', 'orange', 'purple'
      ],
      _jediCouncil: {
        yoda900: 'there is no try',
        windu: 'take a seat',
        kenobi: 'wretched hive of scum and villainy',
        kiAdiMundi: ['but', 'what', 'about', 'the', 'droid', 'attack', 'on', 'the', {
          name: 'wookies',
          planet: 'kashyyyk'
        }],
        skywalker: undefined
      }
    };

    return {testBed, fixture, comp, context};
}
