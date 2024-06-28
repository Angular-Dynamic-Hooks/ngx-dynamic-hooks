import { ElementRef, Provider } from '@angular/core';
import { TestBed, ComponentFixtureAutoDetect, TestBedStatic, ComponentFixture } from '@angular/core/testing';

// Importing files through testing-api file here instead of their own paths.
// This way, we can add easily add the testing-api file as an import to public-api if we want to
// temporarily grant access to all testing resources in the final build. This is useful for testing this
// library with different ng-versions, as it allows us to run the tests from the ng-app against a
// compiled version of this library (by copying this spec-file over) instead of the uncompiled version here.
// There is also no other way to test libraries with older ng-versions, as packagr did not exist back then.

// Testing api resources
import { provideDynamicHooks, HookParserEntry, resetDynamicHooks, DynamicHooksComponent } from '../testing-api';

// Custom testing resources
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { GenericSingleTagStringParser } from '../resources/parsers/genericSingleTagStringParser';
import { GenericMultiTagStringParser } from '../resources/parsers/genericMultiTagStringParser';
import { GenericWhateverStringParser } from '../resources/parsers/genericWhateverStringParser';
import { GenericMultiTagElementParser } from '../resources/parsers/genericMultiTagElementParser';
import { GenericWhateverElementParser } from '../resources/parsers/genericWhateverElementParser';


// The standard parsers to be used for most tests
export const testParsers: Array<HookParserEntry> = [
  // Generic string hook parsers
  GenericSingleTagStringParser,
  GenericMultiTagStringParser,
  GenericWhateverStringParser,
  // Generic element hook parsers
  GenericMultiTagElementParser,
  GenericWhateverElementParser,
  // String SelectorHookParsers
  {
    component: SingleTagTestComponent,
    selector: 'singletag-string-selector',
    bracketStyle: {opening: '[', closing: ']'}, // Forces the use of StringSelectorHookParser
    name: 'SingleTagStringSelectorParser',
    enclosing: false
  },
  {
    component: MultiTagTestComponent,
    selector: 'multitag-string-selector',
    bracketStyle: {opening: '[', closing: ']'}, // Forces the use of StringSelectorHookParser
    name: 'MultiTagStringSelectorParser'
  },
  // Element SelectorHookParsers
  {
    component: MultiTagTestComponent,
    selector: 'multitag-element-selector',
    name: 'MultiTagElementSelectorParser'
  }
];

export interface TestingModuleAndComponent {
  testBed: TestBedStatic;
  fixture: ComponentFixture<DynamicHooksComponent>;
  comp: DynamicHooksComponent;
}

// A simple function to reset and prepare the testing module
export function prepareTestingModule(providers: () => Provider[]): TestingModuleAndComponent {
  // Create testing module
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {provide: ComponentFixtureAutoDetect, useValue: true}, // Enables automatic change detection in test module
      ...providers()
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
  // Just in case
  resetDynamicHooks();

  const {testBed, fixture, comp} = prepareTestingModule(() => [
    provideDynamicHooks({parsers: testParsers})
  ]);
  
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
