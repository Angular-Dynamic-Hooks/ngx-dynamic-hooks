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
import { provideDynamicHooks, DynamicHooksGlobalSettings, HookParserEntry, resetDynamicHooks, DynamicHooksComponent } from '../testing-api';

// Custom testing resources
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { InlineTestComponent } from '../resources/components/inlineTest/inlineTest.c';
import { EnclosingCustomParser } from '../resources/parsers/enclosingCustomParser';
import { NgContentTestParser } from '../resources/parsers/ngContentTestParser';
import { ServiceTestParser } from '../resources/parsers/serviceTestParser';
import { RootTestService } from '../resources/services/rootTestService';


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
  fixture: ComponentFixture<DynamicHooksComponent>;
  comp: DynamicHooksComponent;
}

// A simple function to reset and prepare the testing module
export function prepareTestingModule(parsers?: any, options?: any, extraComponents: Array<any> = []): TestingModuleAndComponent {
  // Generate settings
  const globalSettings: DynamicHooksGlobalSettings = {};
  if (parsers) { globalSettings.globalParsers = parsers; }
  if (options) { globalSettings.globalOptions = options; }

  // Generate declarations
  let declarations: any = [];
  if (parsers) { declarations = declarations.concat(...parsers.filter((entry: any) => typeof entry.component === 'function').map((entry: any) => entry.component)); }
  declarations = declarations.concat(extraComponents);

  // Create testing module
  resetDynamicHooks();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    declarations,
    providers: [
      provideDynamicHooks(globalSettings),
      {provide: ComponentFixtureAutoDetect, useValue: true}, // Enables automatic change detection in test module
      {provide: ElementRef, useClass: MockElementRef},
      RootTestService,
      ServiceTestParser,
      EnclosingCustomParser,
      NgContentTestParser
    ]
  });

  const fixture = TestBed.createComponent(DynamicHooksComponent);
  return {
    testBed: TestBed,
    fixture,
    comp: fixture.componentInstance
  };
}

export interface TestingModuleComponentAndContext {
  testBed: TestBedStatic;
  fixture: ComponentFixture<DynamicHooksComponent>;
  comp: DynamicHooksComponent;
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
