import { ElementRef, Injector } from '@angular/core';
import { TestBed, ComponentFixtureAutoDetect } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { first } from 'rxjs/operators';

// Importing files through testing-api file here instead of their own paths.
// This way, we can add easily add the testing-api file as an import to public-api if we want to
// temporarily grant access to all testing resources in the final build. This is useful for testing this
// library with different ng-versions, as it allows us to run the tests from the ng-app against a
// compiled version of this library (by copying this spec-file over) instead of the uncompiled version here.
// There is also no other way to test libraries with older ng-versions, as packagr did not exist back then.

// Testing api resources
import { DYNAMICHOOKS_GLOBALSETTINGS, DynamicHooksGlobalSettings } from './testing-api';
import { OutletParseResult } from './testing-api';
import { LoadedComponent } from './testing-api';
import { OutletComponent } from './testing-api';
import { OutletOptions, outletOptionDefaults } from './testing-api';
import { HookParserEntry } from './testing-api';
import { SelectorHookParser } from './testing-api';

import { OptionsResolver } from './testing-api';
import { ParserEntryResolver } from './testing-api';
import { ComponentCreator } from './testing-api';
import { ComponentUpdater } from './testing-api';
import { HooksReplacer } from './testing-api';
import { SelectorHookParserConfigResolver } from './testing-api';
import { BindingStateManager } from './testing-api';
import { SelectorHookFinder } from './testing-api';
import { DataTypeEncoder } from './testing-api';
import { DataTypeParser } from './testing-api';
import { DeepComparer } from './testing-api';
import { HookFinder } from './testing-api';
import { OutletService } from './testing-api';

// Custom testing resources
import { SingleTagTestComponent } from './components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from './components/multiTagTest/multiTagTest.c';
import { InlineTestComponent } from './components/inlineTest/inlineTest.c';
import { ParentTestComponent } from './components/parentTest/parentTest.c';
import { ChildTestComponent } from './components/parentTest/childTest/childTest.c';
import { EnclosingCustomParser } from './parsers/enclosingCustomParser';
import { NgContentTestParser } from './parsers/ngContentTestParser';
import { ServiceTestParser } from './parsers/serviceTestParser';
import { NonServiceTestParser } from './parsers/nonServiceTestParser';
import { TESTSERVICETOKEN, TestService } from './services/testService';
import { NgContentTestComponent } from './components/ngContentTest/ngContentTest.c';
import { LazyTestComponent } from './components/lazyTest/lazyTest.c';

export class MockElementRef {
  nativeElement!: {};
}

// The standard parsers to be used for most tests
const testParsers: Array<HookParserEntry> = [
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

// A simple function to reset and prepare the testing module
function prepareTestingModule(parsers?: any, options?: any, extraComponents: Array<any> = []) {
  // Generate settings
  const globalSettings: DynamicHooksGlobalSettings = {};
  if (parsers) { globalSettings.globalParsers = parsers; }
  if (options) { globalSettings.globalOptions = options; }

  // Generate declarations
  let declarations = [OutletComponent];
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
    declarations: declarations,
    providers: providers,
  }).overrideModule(BrowserDynamicTestingModule, {
    set: {
      entryComponents: entryComponents
    }
  });

  const fixture = TestBed.createComponent(OutletComponent);
  return {
    testBed: TestBed,
    fixture: fixture,
    comp: fixture.componentInstance
  };
}


/**
 * This test suite mostly consists of feature-oriented, integration-like tests for the whole library.
 * It implicitly tests the subservices and -classes by testing all functions of the OutletComponent with
 * various inputs and expecting the correct results in the end.
 */
describe('DynamicHooksComponent', () => {
  let testBed;
  let fixture: any;
  let comp: OutletComponent;
  let context: any;

  // Set up
  // ###############################################################################################################################################

  beforeEach(() => {
    ({testBed, fixture, comp} = prepareTestingModule(testParsers));

    context = {
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
  });

  // Tests
  // ###############################################################################################################################################

  // 1. OutletComponent basics
  // --------------------------------------------------------------------------

  it('#should have created the main component correctly', () => {
    expect(comp).toBeDefined();
  });

  it('#should load the global settings correctly', () => {
    const testText = `<p>This p-element has a <span>span-element with a component <dynHooks-singletagtest></span> within it.</p>`;

    // Test with config for SingleTagTestComponent
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      enclosing: false
    }]));
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(SelectorHookParser));
    expect((comp.activeParsers[0] as any)['config'].component.prototype.constructor.name).toBe('SingleTagTestComponent');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');

    // Test with config for MultiTagTestComponent
    ({fixture, comp} = prepareTestingModule([{
      component: MultiTagTestComponent
    }]));
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(SelectorHookParser));
    expect((comp.activeParsers[0] as any)['config'].component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect(Object.keys(comp.hookIndex).length).toBe(0);
  });

  it('#should not crash if the user does not declare global settings', () => {
    const testText = `<p>This is just a bit of text.</p>`;

    ({fixture, comp} = prepareTestingModule());
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(comp['outletService']['globalSettings']).toBeNull();
    expect(fixture.nativeElement.innerHTML.trim()).toBe(testText);

    // Options should be default
    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toBe((outletOptionDefaults as any)[key]);
    }

    // Parsers should be empty
    expect(comp.activeParsers.length).toBe(0);
  });

  it('#should reset and reload when relevant bindings change', () => {
    spyOn(comp, 'parse').and.callThrough();
    spyOn(comp, 'reset').and.callThrough();

    // Initialize
    const testTextOne = `<div>Some random component <dynHooks-multitagtest>with inner content.</dynHooks-multitagtest></div>`;
    comp.content = testTextOne;
    comp.ngOnChanges({content: true});
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.parse as any)['calls'].count()).toBe(1);

    // Change 'text'
    const testTextTwo = `<span>Some other text <dynHooks-singletagtest><dynHooks-multitagtest></dynHooks-multitagtest></span>`;
    comp.content = testTextTwo;
    comp.ngOnChanges({content: true});
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(Object.values(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.parse as any)['calls'].count()).toBe(2);

    // Change 'options'
    const newOptions = {sanitize: false};
    comp.options = newOptions;
    comp.ngOnChanges({options: true});
    expect((comp.parse as any)['calls'].count()).toBe(3);

    // Change 'globalParsersBlacklist'
    const blacklist = ['SingleTagTestComponentParser'];
    comp.globalParsersBlacklist = blacklist;
    comp.ngOnChanges({globalParsersBlacklist: true});
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.parse as any)['calls'].count()).toBe(4);

    // Reset
    (comp as any).globalParsersBlacklist  = null;
    (comp as any).globalParsersWhitelist = null;
    comp.ngOnChanges({globalParsersBlacklist: true, globalParsersWhitelist: true});
    expect(Object.values(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp as any).parse['calls'].count()).toBe(5);

    // Change 'globalParsersWhitelist'
    const whitelist = ['SingleTagTestComponentParser'];
    comp.globalParsersWhitelist = whitelist;
    comp.ngOnChanges({globalParsersWhitelist: true});
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect((comp as any).parse['calls'].count()).toBe(6);

    // Change 'parsers' (while leaving 'globalParsersWhitelist' as is, should be ignored)
    comp.parsers = [{component: MultiTagTestComponent, name: 'LocalParser!'}];
    comp.ngOnChanges({parsers: true});
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(SelectorHookParser));
    expect((comp as any).activeParsers[0]['config'].component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.activeParsers[0]['name']).toBe('LocalParser!');
    expect((comp as any).parse['calls'].count()).toBe(7);
  });

  // 2. HookParsers (in general)
  // --------------------------------------------------------------------------

  it('#should load global parsers correctly', () => {
    comp.content = 'something';
    comp.ngOnChanges({content: true});

    expect(comp.activeParsers.length).toBe(3);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(SelectorHookParser));
    expect(comp.activeParsers[1]).toEqual(jasmine.any(SelectorHookParser));
    expect(comp.activeParsers[2]).toEqual(jasmine.any(SelectorHookParser));
    expect((comp.activeParsers[0] as any)['config'].component.prototype.constructor.name).toBe('SingleTagTestComponent');
    expect((comp.activeParsers[1] as any)['config'].component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.activeParsers[2] as any)['config'].component.prototype.constructor.name).toBe('InlineTestComponent');
  });

  it('#should load local parsers correctly', () => {
    comp.content = 'something';
    comp.parsers = [{
      component: InlineTestComponent,
      parseInputs: false
    }];
    comp.ngOnChanges({content: true, parsers: true});

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(SelectorHookParser));
    expect((comp as any).activeParsers[0]['config'].component.prototype.constructor.name).toBe('InlineTestComponent');
    expect((comp as any).activeParsers[0]['config'].parseInputs).toBe(false);
  });

  it('#should be able to load parsers in their various forms', () => {
    // Should be able to load parsers that are object literals
    comp.content = 'This is a sentence with a <dynhooks-singletagtest>.';
    comp.parsers = [{component: SingleTagTestComponent, enclosing: false}];
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('SelectorHookParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <dynhooks-singletagtest');
    expect(fixture.nativeElement.children[0].tagName).toBe('DYNHOOKS-SINGLETAGTEST');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should be able to load parsers that are services
    comp.content = 'This is a sentence with a <dynhooks-serviceparsercomponent>.';
    comp.parsers = [ServiceTestParser];
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('ServiceTestParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <dynhooks-singletagtest');
    expect(fixture.nativeElement.children[0].tagName).toBe('DYNHOOKS-SINGLETAGTEST');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should be able to load parsers that are classes
    comp.content = 'This is a sentence with a customhook.';
    comp.parsers = [NonServiceTestParser];
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('NonServiceTestParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <dynhooks-singletagtest');
    expect(fixture.nativeElement.children[0].tagName).toBe('DYNHOOKS-SINGLETAGTEST');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should be able to load parsers that are instances
    comp.content = 'This is a sentence with a customhook.';
    comp.parsers = [new NonServiceTestParser()];
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('NonServiceTestParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <dynhooks-singletagtest');
    expect(fixture.nativeElement.children[0].tagName).toBe('DYNHOOKS-SINGLETAGTEST');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();


    // Should ignore invalid parser entries
    comp.content = 'This text is irrelevant for this test.';
    comp.parsers = [true as any];
    spyOn(console, 'error').and.callThrough();
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(0);
    expect((<any> console.error)['calls'].count()).toBe(1);
  });

  it('#should check parser functions', () => {
    comp.content = 'This text is irrelevant for this test.';
    // Create an objects that will be mistaken for parser instances (as they have constructor.name)
    // Test with varying amounts of incomplete parser functions to trigger an error for each scenario
    const noFuncParser = {constructor: {name: 'something'}};
    const parseWithOneFunc = {constructor: {name: 'something'}, findHooks: () => {}};
    const parseWithTwoFuncs = {constructor: {name: 'something'}, findHooks: () => {}, loadComponent: () => {}};

    comp.parsers = [noFuncParser as any];
    spyOn(console, 'error').and.callThrough();
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(0);
    expect((<any> console.error)['calls'].count()).toBe(1);
    expect((<any> console.error)['calls'].mostRecent().args[0]).toBe('Submitted parser does not implement "findHooks()". Removing from list of active parsers:');

    comp.parsers = [parseWithOneFunc as any];
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(0);
    expect((<any> console.error)['calls'].count()).toBe(2);
    expect((<any> console.error)['calls'].mostRecent().args[0]).toBe('Submitted parser does not implement "loadComponent()". Removing from list of active parsers:');

    comp.parsers = [parseWithTwoFuncs as any];
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(0);
    expect((<any> console.error)['calls'].count()).toBe(3);
    expect((<any> console.error)['calls'].mostRecent().args[0]).toBe('Submitted parser does not implement "getBindings()". Removing from list of active parsers:');
  });

  it('#should check parser names', () => {
    comp.content = 'This text is irrelevant for this test.';
    comp.parsers = [
      {component: SingleTagTestComponent, name: 'someParser'},
      {component: MultiTagTestComponent, name: 'someParser'}
    ];
    spyOn(console, 'warn').and.callThrough();
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(2);
    expect((<any> console.warn)['calls'].count()).toBe(1);
    expect((<any> console.warn)['calls'].mostRecent().args[0]).toBe('Parser name "someParser" is not unique and appears multiple times in the list of active parsers.');
  });

  it('#should load fine without parsers', () => {
    ({fixture, comp} = prepareTestingModule([]));

    comp.content = 'something';
    comp.ngOnChanges({content: true});

    expect(comp.activeParsers.length).toBe(0);
    expect(fixture.nativeElement.innerHTML.trim()).toBe('something');
  });

  it('#should apply the parserBlacklist and parserWhitelist, if requested', () => {
    const testText = `
      <p><dynhooks-singletagtest></p>
      <p><dynhooks-multitagtest></dynhooks-multitagtest></p>
      <p><dynhooks-inlinetest></dynhooks-inlinetest></p>
    `;
    comp.content = testText;
    (comp as any).globalParsersBlacklist = null;
    (comp as any).globalParsersWhitelist = null;
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true});

    // Expect that no component is filtered
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.inline-component')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(3);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[3].componentRef.instance.constructor.name).toBe('InlineTestComponent');

    // Blacklist: Expect that MultiTagComponentParser is not loaded
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.globalParsersBlacklist = ['MultiTagTestComponentParser'];
    (comp as any).globalParsersWhitelist = null;
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true});

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.inline-component')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('InlineTestComponent');

    // WhiteList: Expect that only InlineTestComponentParser is loaded
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    (comp as any).globalParsersBlacklist = null;
    comp.globalParsersWhitelist = ['InlineTestComponentParser'];
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true});

    expect(fixture.nativeElement.querySelector('.singletag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.inline-component')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('InlineTestComponent');

    // Both: Expect that only SingleTagTestComponentParser is loaded
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.globalParsersBlacklist = ['MultiTagTestComponentParser'];
    comp.globalParsersWhitelist = ['SingleTagTestComponentParser', 'MultiTagTestComponentParser'];
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true});

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.inline-component')).toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
  });

  it('#should check the parserBlacklist and parserWhitelist', () => {
    const testText = 'This text is irrelevant for this test';
    comp.content = testText;
    comp.globalParsersBlacklist = ['blacklistedParser'];
    comp.globalParsersWhitelist = ['whitelistedParser'];
    spyOn(console, 'warn').and.callThrough();
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true});

    // Check that warnings have been fired
    expect((<any>console.warn)['calls'].count()).toBe(2);
    expect((<any>console.warn)['calls'].allArgs()[0][0]).toBe('Blacklisted parser name "blacklistedParser" does not appear in the list of global parsers names. Make sure both spellings are identical.');
    expect((<any>console.warn)['calls'].allArgs()[1][0]).toBe('Whitelisted parser name "whitelistedParser" does not appear in the list of global parsers names. Make sure both spellings are identical.');
  });

  it('#should ensure the component field of a parser is correct', () => {
    // Load with nonsensical componentConfig
    expect(() => comp['outletService']['componentCreator'].loadComponentClass(true as any))
      .toThrow(new Error('The "component" property of a returned HookData object must either contain the component class or a LazyLoadComponentConfig'));
  });

  it('#should check that the "importPromise"-field  of lazy-loaded parsers is not the promise itself', () => {
    comp.content = 'Should load here: <someSelector></someSelector>';
    comp.parsers = [{
      component: {
        importPromise: (new Promise(() => {})) as any,
        importName: 'test'
      },
      selector: 'someSelector'
    }];
    spyOn(console, 'error');
    comp.ngOnChanges({content: true, parsers: true});

    expect(comp.activeParsers.length).toBe(1);
    expect((<any>console.error)['calls'].mostRecent().args[0]).toBe('When lazy-loading a component, the "importPromise"-field must contain a function returning the import-promise, but it contained the promise itself.');
  });

  it('#should warn if using lazy-loaded parsers with old Angular versions', () => {
    // Load app first
    comp.content = 'Should load here: <someSelector></someSelector>';
    spyOn(console, 'warn');
    comp.ngOnChanges({content: true});

    // Change ng-version
    fixture.nativeElement.setAttribute('ng-version', 8);

    // Load parser and check that it warns the user
    comp.parsers = [{
      component: {
        importPromise: () => new Promise(() => {}),
        importName: 'test'
      },
      selector: 'someSelector'
    }];
    comp.ngOnChanges({parsers: true});

    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('It seems you are trying to use lazy-loaded-components with an Angular version older than 9. Please note that this functionality requires the new Ivy renderer to be enabled.');
  });

  it('#should resubscribe to outputs if outputs returned by parser changed', () => {
    const testText = `<dynhooks-singletagtest (httpResponseReceived)="content.maneuvers.getMentalState()">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    spyOn(comp.hookIndex[1].componentRef.instance['httpResponseReceived'], 'subscribe').and.callThrough();

    // Change returned output
    spyOn(comp.activeParsers[0], 'getBindings').and.returnValue({
      outputs: {
        httpResponseReceived: () => 'someotherfunction'
      }
    });

    // Trigger cd
    comp.ngDoCheck();

    // Should have resubscribed
    expect(comp.hookIndex[1].componentRef.instance['httpResponseReceived'].subscribe['calls'].count()).toBe(1);
  });

  it('#should validate the HookPositions of parsers', () => {
    const hooksReplacer = comp['outletService']['hooksReplacer'];
    spyOn(console, 'warn').and.callThrough();

    // 1. Every hook must be in itself well-formed
    // -------------------------------------------

    // openingTagEndIndex must be greater than openingTagStartIndex
    let parserResults: any = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 10,
        openingTagEndIndex: 5
      }
    }];
    hooksReplacer['validateHookPositions'](parserResults, '');
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions - openingTagEndIndex has to be greater than openingTagStartIndex. Ignoring.');

    // closingTag must start after openingTag
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 15,
        closingTagStartIndex: 10,
        closingTagEndIndex: 20,
      }
    }];
    hooksReplacer['validateHookPositions'](parserResults, '');
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions - The closing tag must start after the opening tag has concluded. Ignoring.');

    // closingTagEndIndex must be greater than closingTagStartIndex
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 10,
        closingTagStartIndex: 20,
        closingTagEndIndex: 15,
      }
    }];
    hooksReplacer['validateHookPositions'](parserResults, '');
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions - closingTagEndIndex has to be greater than closingTagStartIndex. Ignoring.');

    // 2. The opening/closing tags of a hook must not overlap with those of another hook
    // ---------------------------------------------------------------------------------
    spyOn(hooksReplacer, 'generateHookPosWarning' as any).and.callThrough();

    // must not have identical indexes
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 10,
        closingTagStartIndex: 15,
        closingTagEndIndex: 20
      }
    }, {
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 10,
        closingTagStartIndex: 15,
        closingTagEndIndex: 20,
      }
    }];
    hooksReplacer['validateHookPositions'](parserResults, '');
    expect(hooksReplacer['generateHookPosWarning']['calls'].mostRecent().args[0]).toBe('A hook with the same position as another hook was found. There may be multiple identical parsers active that are looking for the same hook. Ignoring duplicates.');

    // Opening tag must begin after previous opening tag has ended
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 15
      }
    }, {
      parser: null,
      hookPosition: {
        openingTagStartIndex: 10,
        openingTagEndIndex: 20,
      }
    }];
    hooksReplacer['validateHookPositions'](parserResults, '');
    expect(hooksReplacer['generateHookPosWarning']['calls'].mostRecent().args[0]).toBe('Error when checking hook positions: Hook opening tag starts before previous hook opening tag ends. Ignoring.');

    // Opening tag must not overlap with previous closing tag
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 10,
        closingTagStartIndex: 15,
        closingTagEndIndex: 20
      }
    }, {
      parser: null,
      hookPosition: {
        openingTagStartIndex: 15,
        openingTagEndIndex: 20,
        closingTagStartIndex: 25,
        closingTagEndIndex: 30,
      }
    }];
    hooksReplacer['validateHookPositions'](parserResults, '');
    expect(hooksReplacer['generateHookPosWarning']['calls'].mostRecent().args[0]).toBe('Error when checking hook positions: Opening tag of hook overlaps with closing tag of previous hook. Ignoring.');

    // Closing tag must not overlap with previous closing tag
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 10,
        closingTagStartIndex: 30,
        closingTagEndIndex: 35
      }
    }, {
      parser: null,
      hookPosition: {
        openingTagStartIndex: 15,
        openingTagEndIndex: 20,
        closingTagStartIndex: 30,
        closingTagEndIndex: 40,
      }
    }];
    hooksReplacer['validateHookPositions'](parserResults, '');
    expect(hooksReplacer['generateHookPosWarning']['calls'].mostRecent().args[0]).toBe('Error when checking hook positions: Closing tag of hook overlaps with closing tag of previous hook. Ignoring.');

    // Check if hooks are incorrectly nested
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 10,
        closingTagStartIndex: 25,
        closingTagEndIndex: 30
      }
    }, {
      parser: null,
      hookPosition: {
        openingTagStartIndex: 15,
        openingTagEndIndex: 20,
        closingTagStartIndex: 35,
        closingTagEndIndex: 40,
      }
    }];
    hooksReplacer['validateHookPositions'](parserResults, '');
    expect(hooksReplacer['generateHookPosWarning']['calls'].mostRecent().args[0]).toBe('Error when checking hook positions: The closing tag of a nested hook lies beyond the closing tag of the outer hook. Ignoring.');
  });

  // 3. Loading dynamic components
  // --------------------------------------------------------------------------

  it('#should load just the text if there are no dynamic components', () => {
    const testText = `
    <div>
      <p>This is a bit of prose. If has no dynamic components in it.</p>
      <p>Hopefully, this does not cause the app to explode.</p>
    </div>
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.innerHTML.trim()).toBe(testText.trim());
    expect(Object.values(comp.hookIndex).length).toBe(0);
  });

  it('#should load a single tag dynamic component', () => {
    const testText = `<p>This p-element has a <span>span-element with a component <dynHooks-singletagtest [stringPropAlias]="'/media/maps/valley_of_the_four_winds.png'" [simpleArray]='["chen stormstout", "nomi"]'></span> within it.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null); // Component has loaded
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
  });

  it('#should load a multi tag dynamic component', () => {
    const testText = `<p>This is a multi tag component <dynHooks-multitagtest>This is the inner content.</dynHooks-multitagtest>.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null); // Component has loaded
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('This is the inner content.'); // Transcluded content works
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
  });

  it('#should load component hooks without any text surrounding them', () => {
    const testText = `<dynHooks-singletagtest [stringPropAlias]="'/media/maps/valley_of_the_four_winds.png'" [simpleArray]='["chen stormstout", "nomi"]'>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');

    // Try with multitag
    comp.content = `<dynHooks-multitagtest></dynHooks-multitagtest>`;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');

    // And with a custom parser
    comp.content = 'customhook.';
    comp.parsers = [NonServiceTestParser];
    comp.ngOnChanges({content: true, parsers: true});

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
  });

  it('#should remove components if they fail to load', () => {
    const testText = `<dynHooks-multitagtest>This is the inner content.</dynHooks-multitagtest>`;
    comp.content = testText;
    spyOn(comp['outletService']['componentCreator'], 'createComponent').and.throwError('Test error');
    spyOn(console, 'error');
    comp.ngOnChanges({content: true});

    expect(Object.values(comp.hookIndex).length).toBe(0);
    expect((<any>console.error)['calls'].count()).toBe(1);
  });

  it('#should load child components (with parent providers)', () => {
    const parsersWithParentComponentParser = testParsers.concat([{
      component: ParentTestComponent
    }]);
    ({fixture, comp} = prepareTestingModule(parsersWithParentComponentParser, undefined, [ParentTestComponent, ChildTestComponent]));

    const testText = `
    <p>Here's a normal parent component, which should contain its child component as declared in the template: <dynhooks-parenttest></dynhooks-parenttest></p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    // Check that parent component has loaded correctly
    const parentComponent = comp.hookIndex[1].componentRef.instance;
    expect(fixture.nativeElement.querySelector('.parenttest-component')).not.toBe(null); // Component has loaded
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(parentComponent.constructor.name).toBe('ParentTestComponent');
    expect(parentComponent.blubbService).toEqual({name: 'blubb'});

    // Check that child component has loaded correctly
    const childComponent = parentComponent.childTestComponent;
    expect(fixture.nativeElement.querySelector('.childtest-component')).not.toBe(null); // Component has loaded
    expect(childComponent.constructor.name).toBe('ChildTestComponent');
    expect(childComponent.blubbService).toBe(parentComponent.blubbService);
  });

  it('#should load nested content-components', () => {
    const testText = `
    <p>Some advanced nesting:
      <dynhooks-multitagtest id="'nestedImage-outer'">
        <dynhooks-multitagtest id="'nestedImage-inner-1'">lorem ipsum dolor sit amet
          <dynhooks-singletagtest [stringPropAlias]="'this is the first singletagtest'" [simpleArray]='["testString1", "testString2"]'>
          <dynhooks-multitagtest id="'nestedImage-inner-1-1'">
            here is some deeply nested text
            <dynhooks-inlinetest id="nestedtextbox-inner-bolder" [config]="{prop: true}">some text in bold</dynhooks-inlinetest>
            <span>And an element in between</span>
            <dynhooks-singletagtest>
          </dynhooks-multitagtest>
        </dynhooks-multitagtest>
        <dynhooks-multitagtest id="'nestedImage-inner-2'" [nr]='867'></dynhooks-multitagtest>
      </dynhooks-multitagtest>
    </p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(Object.keys(comp.hookIndex).length).toBe(7);

    const grandParentComponentEl = fixture.nativeElement.children[0].children[0];
    expect(grandParentComponentEl.children[0].className).toBe('multitag-component');

    const parentComponentOneEl = grandParentComponentEl.children[0].children[0];
    const parentComponentTwoEl = grandParentComponentEl.children[0].children[1];
    expect(parentComponentOneEl.children[0].className).toBe('multitag-component');
    expect(parentComponentTwoEl.children[0].className).toBe('multitag-component');
    expect(comp.hookIndex[7].componentRef.instance.nr).toBe(867);

    const childComponentOneEl = parentComponentOneEl.children[0].children[0];
    const childComponentTwoEl = parentComponentOneEl.children[0].children[1];
    expect(childComponentOneEl.children[0].className).toBe('singletag-component');
    expect(childComponentTwoEl.children[0].className).toBe('multitag-component');
    expect(comp.hookIndex[3].componentRef.instance.stringProp).toBe('this is the first singletagtest');
    expect(comp.hookIndex[3].componentRef.instance.simpleArray).toEqual(["testString1", "testString2"]);

    const grandcChildComponentOneEl = childComponentTwoEl.children[0].children[0];
    const spanInBetween = childComponentTwoEl.children[0].children[1];
    const grandcChildComponentTwoEl = childComponentTwoEl.children[0].children[2];
    expect(grandcChildComponentOneEl.children[0].className).toBe('inline-component');
    expect(spanInBetween.textContent).toBe('And an element in between');
    expect(grandcChildComponentTwoEl.children[0].className).toBe('singletag-component');
    expect(comp.hookIndex[5].componentRef.instance.config).toEqual({prop: true});

    expect(Object.values(comp.hookIndex).length).toBe(7);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[3].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[4].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[5].componentRef.instance.constructor.name).toBe('InlineTestComponent');
    expect(comp.hookIndex[6].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[7].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
  });

  it('#should not load incorrectly nested content-components', () => {
    const testText = `<p>Overlapping textboxes: <dynhooks-multitagtest id="'overlapping'">text from multitag<dynhooks-inlinetest id="'overlapping-inner'">text from inline</dynhooks-multitagtest></dynhooks-inlinetest></p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.inline-component')).toBe(null);
  });

  it('#should load components at their correct positions', () => {
    const testText = `
    <ul>
      <li>This is the first li-element.</li>
      <li>This is the <dynhooks-inlinetest>second</dynhooks-inlinetest> li-element. It has a component <dynhooks-singletagtest [stringPropAlias]="'/media/maps/azsuna.png'" [simpleArray]='["Farondis"]'> in it. Lets put another component <dynhooks-singletagtest [stringPropAlias]="'/media/maps/suramar.png'" [simpleArray]='["Elisande", "Thalyssra"]'> here.</li>
      <li>This is the third li-element. It has a <a href="https://www.google.de" target="_blank">link</a>.</li>
      <li>
        <span>And this is the last</span>
        <dynhooks-multitagtest [someinput]="{test: true}" (someOutput)="context.var.func($event)">
          <span>element in this test</span>
        </dynhooks-multitagtest>
        <span>that we are looking at.</span>
      </li>
    </ul>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    const ul = fixture.nativeElement.children[0];
    const firstLi = ul.children[0];
    expect(firstLi.innerText).toBe('This is the first li-element.');

    const secondLi = ul.children[1];
    expect(secondLi.innerHTML).toContain('This is the <dynhooks-inlinetest');
    expect(secondLi.children[0].children[0].className).toBe('inline-component');
    expect(secondLi.children[0].children[0].innerText.trim()).toBe('second');
    expect(secondLi.innerHTML).toContain('</dynhooks-inlinetest> li-element. It has a component <dynhooks-singletagtest');
    expect(secondLi.children[1].children[0].className).toBe('singletag-component');
    expect(secondLi.innerHTML).toContain('</dynhooks-singletagtest> in it. Lets put another component <dynhooks-singletagtest');
    expect(secondLi.children[2].children[0].className).toBe('singletag-component');
    expect(secondLi.innerHTML).toContain('</dynhooks-singletagtest> here.');

    const thirdLi = ul.children[2];
    expect(thirdLi.innerHTML).toContain('This is the third li-element. It has a <a ');
    expect(thirdLi.children[0].tagName).toBe('A');
    expect(thirdLi.children[0].textContent).toBe('link');
    expect(thirdLi.innerHTML).toContain('</a>.');

    const fourthLi = ul.children[3];
    expect(fourthLi.children[0].tagName).toBe('SPAN');
    expect(fourthLi.children[0].textContent).toBe('And this is the last');
    expect(fourthLi.children[1].children[0].className).toBe('multitag-component');
    expect(fourthLi.children[1].children[0].children[0].tagName).toBe('SPAN');
    expect(fourthLi.children[1].children[0].children[0].textContent).toBe('element in this test');
    expect(fourthLi.children[2].tagName).toBe('SPAN');
    expect(fourthLi.children[2].textContent).toBe('that we are looking at.');
  });

  it('#should load custom ng-content properly', () => {
    // Test custom ng-content
    // NgContentTestParser always returns unique hardcoded ngContent for NgContentTestComponent
    // instead of the actual childNodes. Check that this hardcoded content is correctly rendered.

    const parsersWithNgContentParser = testParsers.concat([NgContentTestParser]);
    ({fixture, comp} = prepareTestingModule(parsersWithNgContentParser, undefined, [NgContentTestComponent]));
    const testText = `<dynhooks-ngcontenttest><p>original content</p><dynhooks-singletagtest></dynhooks-ngcontenttest>`;
    comp.content = testText;
    comp.context = {};
    comp.ngOnChanges({content: true, context: context});

    // Inner component should be removed
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('NgContentTestComponent');

    // Make sure that <ng-content> slots of NgContentComponent are correctly filled out
    const componentElement = fixture.nativeElement.children[0];
    const firstContentContainer = componentElement.children[0].children[0].children[1];
    const secondContentContainer = componentElement.children[0].children[1].children[1];
    const thirdContentContainer = componentElement.children[0].children[2].children[1];

    expect(firstContentContainer.innerHTML.trim()).toBe('<span>this should be highlighted</span>');                    // Should replace normal child nodes
    expect(secondContentContainer.innerHTML.trim()).toBe('');                                                          // Intentionally skipped this ngContent-index
    expect(thirdContentContainer.innerHTML.trim()).toBe('<h2>This is the title</h2><div>Some random content</div>');   // Should have two elements
  });

  it('#should trigger ngOnInit() after component creation', () => {
    const testText = `Just some component: <dynhooks-singletagtest>`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});

    const loadedComp = comp.hookIndex[1].componentRef.instance;
    expect(loadedComp.ngOnInitTriggered).toBe(true);
  });

  it('#should trigger ngOnChanges() after component creation and any time an input changes', () => {
    const testText = `Just some component: <dynhooks-singletagtest [numberProp]="context.order">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true});

    const loadedComp = comp.hookIndex[1].componentRef.instance;
    expect(loadedComp.ngOnChangesTriggered).toBe(true);
    expect(loadedComp.numberProp).toBe(66);

    // Change bound input and expect ngOnChanges to trigger
    spyOn(loadedComp, 'ngOnChanges').and.callThrough();
    context.order = 77;
    comp.ngDoCheck();

    expect(loadedComp.numberProp).toBe(77);
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(1);
  });

  it('#should correctly trigger onDynamicMount() on init', () => {
    const testText = `
    <dynhooks-multitagtest id="outercomp">
      bla bla
      <dynhooks-singletagtest>
      <p>some<b>text</b></p>
      <div>
        <dynhooks-multitagtest id="innercomp">
          <dynhooks-singletagtest>
          <div data-attribute-level1>
            <div data-attribute-level1>
              <dynhooks-inlinetest></dynhooks-inlinetest>
            </div>
            <dynhooks-singletagtest>
          </div>
          yada yada
          <ul>
            <li>first li</li>
            <li>second li with <dynhooks-inlinetest></dynhooks-inlinetest></li>
            <li>third li</li>
          </ul>
        </dynhooks-multitagtest>
      </div>
    </dynhooks-multitagtest>`;

    comp.content = testText;
    comp.context = context;
    comp.parsers = [...testParsers, EnclosingCustomParser];
    comp.ngOnChanges({content: true, parsers: true, context: true});

    // Denoting level of nestedness with number prefix here
    const one_multiTagComp = comp.hookIndex[1].componentRef.instance;
    const two_singleTagComp = comp.hookIndex[2].componentRef.instance;
    const two_multiTagComp = comp.hookIndex[3].componentRef.instance;
    const three_singleTagComp = comp.hookIndex[4].componentRef.instance;
    const three_customComp = comp.hookIndex[5].componentRef.instance;
    const four_customComp = comp.hookIndex[6].componentRef.instance;
    const four_singleTagComp = comp.hookIndex[7].componentRef.instance;
    const five_inlineComp = comp.hookIndex[8].componentRef.instance;
    const three_inlineComp = comp.hookIndex[9].componentRef.instance;

    // Context should have been passed in
    expect(one_multiTagComp.mountContext).toEqual(context);
    expect(two_singleTagComp.mountContext).toEqual(context);
    expect(two_multiTagComp.mountContext).toEqual(context);
    expect(three_singleTagComp.mountContext).toEqual(context);
    expect(three_customComp.mountContext).toEqual(context);
    expect(four_customComp.mountContext).toEqual(context);
    expect(four_singleTagComp.mountContext).toEqual(context);
    expect(five_inlineComp.mountContext).toEqual(context);
    expect(three_inlineComp.mountContext).toEqual(context);

    // Content children should have been generated and passed into all loaded components
    // Test each individually (all the way down)
    expect(one_multiTagComp.mountContentChildren.length).toBe(2);
    expect(one_multiTagComp.mountContentChildren[0].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[0].componentSelector).toBe('dynhooks-singletagtest');
    expect(one_multiTagComp.mountContentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-singletagtest>', closingTag: null});
    expect(one_multiTagComp.mountContentChildren[0].contentChildren.length).toBe(0);
    expect(one_multiTagComp.mountContentChildren[1].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].componentSelector).toBe('dynhooks-multitagtest');
    expect(one_multiTagComp.mountContentChildren[1].hookValue).toEqual({openingTag: '<dynhooks-multitagtest id="innercomp">', closingTag: '</dynhooks-multitagtest>'});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren.length).toBe(3);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[0].componentSelector).toBe('dynhooks-singletagtest');
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[0].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-singletagtest>', closingTag: null});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren.length).toBe(0);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].componentSelector).toBe('dynhooks-multitagtest');
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].hookValue).toEqual({openingTag: '<div data-attribute-level1>', closingTag: '</div>'});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren.length).toBe(2);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].componentSelector).toBe('dynhooks-multitagtest');
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].hookValue).toEqual({openingTag: '<div data-attribute-level1>', closingTag: '</div>'});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren.length).toBe(1);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren[0].componentSelector).toBe('dynhooks-inlinetest');
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren[0].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-inlinetest>', closingTag: '</dynhooks-inlinetest>'});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren[0].contentChildren.length).toBe(0);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[1].componentSelector).toBe('dynhooks-singletagtest');
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[1].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[1].hookValue).toEqual({openingTag: '<dynhooks-singletagtest>', closingTag: null});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[1].contentChildren.length).toBe(0);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[2].componentSelector).toBe('dynhooks-inlinetest');
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[2].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[2].hookValue).toEqual({openingTag: '<dynhooks-inlinetest>', closingTag: '</dynhooks-inlinetest>'});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[2].contentChildren.length).toBe(0);

    expect(two_singleTagComp.mountContentChildren.length).toBe(0);

    expect(two_multiTagComp.mountContentChildren.length).toBe(3);
    expect(two_multiTagComp.mountContentChildren[0].componentSelector).toBe('dynhooks-singletagtest');
    expect(two_multiTagComp.mountContentChildren[0].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-singletagtest>', closingTag: null});
    expect(two_multiTagComp.mountContentChildren[0].contentChildren.length).toBe(0);
    expect(two_multiTagComp.mountContentChildren[1].componentSelector).toBe('dynhooks-multitagtest');
    expect(two_multiTagComp.mountContentChildren[1].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[1].hookValue).toEqual({openingTag: '<div data-attribute-level1>', closingTag: '</div>'});
    expect(two_multiTagComp.mountContentChildren[1].contentChildren.length).toBe(2);
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].componentSelector).toBe('dynhooks-multitagtest');
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].hookValue).toEqual({openingTag: '<div data-attribute-level1>', closingTag: '</div>'});
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren.length).toBe(1);
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren[0].componentSelector).toBe('dynhooks-inlinetest');
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren[0].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-inlinetest>', closingTag: '</dynhooks-inlinetest>'});
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren[0].contentChildren.length).toBe(0);
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[1].componentSelector).toBe('dynhooks-singletagtest');
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[1].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[1].hookValue).toEqual({openingTag: '<dynhooks-singletagtest>', closingTag: null});
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren.length).toBe(0);
    expect(two_multiTagComp.mountContentChildren[2].componentSelector).toBe('dynhooks-inlinetest');
    expect(two_multiTagComp.mountContentChildren[2].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[2].hookValue).toEqual({openingTag: '<dynhooks-inlinetest>', closingTag: '</dynhooks-inlinetest>'});
    expect(two_multiTagComp.mountContentChildren[2].contentChildren.length).toBe(0);

    expect(three_singleTagComp.mountContentChildren.length).toBe(0);

    expect(three_customComp.mountContentChildren.length).toBe(2);
    expect(three_customComp.mountContentChildren[0].componentSelector).toBe('dynhooks-multitagtest');
    expect(three_customComp.mountContentChildren[0].componentRef).toBeDefined();
    expect(three_customComp.mountContentChildren[0].hookValue).toEqual({openingTag: '<div data-attribute-level1>', closingTag: '</div>'});
    expect(three_customComp.mountContentChildren[0].contentChildren.length).toBe(1);
    expect(three_customComp.mountContentChildren[0].contentChildren[0].componentSelector).toBe('dynhooks-inlinetest');
    expect(three_customComp.mountContentChildren[0].contentChildren[0].componentRef).toBeDefined();
    expect(three_customComp.mountContentChildren[0].contentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-inlinetest>', closingTag: '</dynhooks-inlinetest>'});
    expect(three_customComp.mountContentChildren[0].contentChildren[0].contentChildren.length).toBe(0);
    expect(three_customComp.mountContentChildren[1].componentSelector).toBe('dynhooks-singletagtest');
    expect(three_customComp.mountContentChildren[1].componentRef).toBeDefined();
    expect(three_customComp.mountContentChildren[1].hookValue).toEqual({openingTag: '<dynhooks-singletagtest>', closingTag: null});
    expect(three_customComp.mountContentChildren[1].contentChildren.length).toBe(0);

    expect(four_customComp.mountContentChildren.length).toBe(1);
    expect(four_customComp.mountContentChildren[0].componentSelector).toBe('dynhooks-inlinetest');
    expect(four_customComp.mountContentChildren[0].componentRef).toBeDefined();
    expect(four_customComp.mountContentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-inlinetest>', closingTag: '</dynhooks-inlinetest>'});
    expect(four_customComp.mountContentChildren[0].contentChildren.length).toBe(0);

    expect(four_singleTagComp.mountContentChildren.length).toBe(0);

    expect(five_inlineComp.mountContentChildren.length).toBe(0);

    expect(three_inlineComp.mountContentChildren.length).toBe(0);
  });

  it('#should correctly trigger onDynamicChanges() on context reference change', () => {
    const testText = `<dynhooks-singletagtest>`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    const loadedComp = comp.hookIndex[1].componentRef.instance;
    spyOn(loadedComp, 'onDynamicChanges').and.callThrough();
    spyOn(comp['componentUpdater'], 'refresh').and.callThrough();

    // Should be set from initial call
    expect(loadedComp.changesContext).toEqual(context);

    // Shouldn't be called again when context property changes...
    comp.context.order = 77;
    comp.ngDoCheck();
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(1);
    expect(loadedComp.onDynamicChanges['calls'].count()).toBe(0);

    // ...only when context object changes by reference
    const newContext = {newProps: [1, 2, 3, 'something']};
    comp.context = newContext;
    comp.ngOnChanges({context: true});
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(2);
    expect(loadedComp.onDynamicChanges['calls'].count()).toBe(1);
    expect(loadedComp.changesContext).toEqual(newContext);
  });

  it('#should activate change detection for dynamically loaded components', () => {
    const testText = `<dynhooks-singletagtest [numberProp]="context.order">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});

    // Change detection should have run in all components
    expect(fixture.nativeElement.querySelector('.singletag-nr').textContent).toBe('66');

    // Change bound variable
    comp.context.order = 77;

    // Trigger cd
    fixture.detectChanges();

    // Should have updated
    expect(fixture.nativeElement.querySelector('.singletag-nr').textContent).toBe('77');

  });

  it('#should activate dependency injection for dynamically loaded components', () => {
    const testText = `
    <p>
      This is the first component: <dynhooks-singletagtest>.
      This is the second component: <dynhooks-multitagtest></dynhooks-multitagtest>.
    </p>
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(Object.keys(comp.hookIndex).length).toEqual(2);
    const firstComp = comp.hookIndex[1].componentRef.instance;
    const secondComp = comp.hookIndex[2].componentRef.instance;

    // Should be loaded in both
    expect(firstComp['cd']).not.toBeFalsy();
    expect(secondComp['cd']).not.toBeFalsy();
    expect(firstComp['testService']['someString']).toBe('The TestService has loaded!');
    expect(secondComp['testService']['someString']).toBe('The TestService has loaded!');

    // Change value in service
    firstComp['testService']['someString'] = 'Value has changed!';

    // Should be reflected in both
    expect(firstComp['testService']['someString']).toBe('Value has changed!');
    expect(secondComp['testService']['someString']).toBe('Value has changed!');
  });

  it('#should trigger componentsLoaded when all components have loaded', () => {
    const testText = `
      <p>Let's load a couple of components like</p>
      <dynhooks-singletagtest [stringPropAlias]="'some random sentence'">
      <dynhooks-multitagtest [nr]="99">
        <dynhooks-inlinetest [nr]="1000"></dynhooks-inlinetest>
      </dynHooks-multitagtest>
      <p>Really cool stuff.</p>
    `;

    comp.content = testText;
    let loadedComponents: LoadedComponent[] = [];
    comp.componentsLoaded.pipe(first()).subscribe((lc: any) => loadedComponents = lc);
    comp.ngOnChanges({content: true});

    expect(Object.values(comp.hookIndex).length).toBe(3);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[3].componentRef.instance.constructor.name).toBe('InlineTestComponent');

    // componentsLoaded should have triggered
    expect(loadedComponents.length).toBe(3);

    expect(loadedComponents[0].hookId).toBe(1);
    expect(loadedComponents[0].hookValue as any).toEqual({openingTag: `<dynhooks-singletagtest [stringPropAlias]="'some random sentence'">`, closingTag: null});
    expect(loadedComponents[0].hookParser).toBeDefined();
    expect(loadedComponents[0].componentRef.instance.stringProp).toBe('some random sentence');

    expect(loadedComponents[1].hookId).toBe(2);
    expect(loadedComponents[1].hookValue).toEqual({openingTag: `<dynhooks-multitagtest [nr]="99">`, closingTag: `</dynHooks-multitagtest>`});
    expect(loadedComponents[1].hookParser).toBeDefined();
    expect(loadedComponents[1].componentRef.instance.nr).toBe(99);

    expect(loadedComponents[2].hookId).toBe(3);
    expect(loadedComponents[2].hookValue).toEqual({openingTag: `<dynhooks-inlinetest [nr]="1000">`, closingTag: `</dynhooks-inlinetest>`});
    expect(loadedComponents[2].hookParser).toBeDefined();
    expect(loadedComponents[2].componentRef.instance.nr).toBe(1000);
  });

  it('#should lazy-load components', (done) => {
    const parsersWithLazyParser = testParsers.concat([{
      component: {
        importPromise: () => import('./components/lazyTest/lazyTest.c'),
        importName: 'LazyTestComponent'
      },
      selector: 'dynhooks-lazytest'
    }]);
    ({fixture, comp} = prepareTestingModule(parsersWithLazyParser, undefined, [LazyTestComponent]));
    const testText = `
      <p>
        A couple of components:
        <dynhooks-singletagtest [stringPropAlias]="'something'">
        <dynhooks-multitagtest [nr]="4">
          <dynhooks-lazytest [name]="'sleepy'"></dynhooks-lazytest>
        </dynHooks-multitagtest>
        <dynhooks-inlinetest [nr]="87"></dynhooks-inlinetest>
      </p>
    `;

    comp.content = testText;
    comp.context = context;
    let loadedComponents: LoadedComponent[] = [];
    comp.componentsLoaded.pipe(first()).subscribe((lc: any) => loadedComponents = lc);
    comp.ngOnChanges({content: true, context: true});

    // Only run this test if ng-version is 9+ (ivy enabled)
    const versionElement = document.querySelector('[ng-version]');
    const versionAttr = versionElement ? versionElement.getAttribute('ng-version') : null;
    const version = versionAttr !== null ? parseInt(versionAttr, 10) : null;
    if (version && version < 9) {
      expect(true).toBe(true);
      done();
    } else {

      // Everything except the lazy-loaded component should be loaded
      expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
      expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
      expect(fixture.nativeElement.querySelector('.inline-component')).not.toBe(null);
      expect(fixture.nativeElement.querySelector('.lazy-component')).toBe(null);
      expect(fixture.nativeElement.querySelector('dynamic-component-anchor')).not.toBe(null);

      expect(Object.values(comp.hookIndex).length).toBe(4);
      expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
      expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
      expect(comp.hookIndex[3].componentRef).toBeNull();
      expect(comp.hookIndex[4].componentRef.instance.constructor.name).toBe('InlineTestComponent');

      // Make sure that onDynamicChanges has triggered on component init
      spyOn(comp.hookIndex[2].componentRef.instance, 'onDynamicChanges').and.callThrough();
      expect(comp.hookIndex[2].componentRef.instance.onDynamicChanges['calls'].count()).toBe(0);
      expect(comp.hookIndex[2].componentRef.instance.changesContext).toEqual(context);
      expect(comp.hookIndex[2].componentRef.instance.changesContentChildren).toBeUndefined();

      // Make sure that onDynamicMount has not yet triggered
      spyOn(comp.hookIndex[2].componentRef.instance, 'onDynamicMount').and.callThrough();
      expect(comp.hookIndex[2].componentRef.instance.onDynamicMount['calls'].count()).toBe(0);
      expect(comp.hookIndex[2].componentRef.instance.mountContext).toBeUndefined();
      expect(comp.hookIndex[2].componentRef.instance.mountContentChildren).toBeUndefined();

      // Also, componentsLoaded should not yet have triggered
      expect(loadedComponents).toEqual([]);

      // Have to manually wait. Neither tick() nor fixture.whenStable() seems to wait for dynamic imports
      setTimeout(() => {
        // Lazy-loaded component should be loaded by now in anchor
        expect(fixture.nativeElement.querySelector('.lazy-component')).not.toBe(null);
        expect(fixture.nativeElement.querySelector('dynamic-component-anchor')).not.toBe(null);
        expect(fixture.nativeElement.querySelector('dynamic-component-anchor').classList[0]).toBe('dynhooks-lazytest-anchor');    // Anchor should have comp class
        expect(fixture.nativeElement.querySelector('dynamic-component-anchor').childNodes[0].tagName).toBe('DYNHOOKS-LAZYTEST');  // Selector element should be loaded in anchor
        expect(comp.hookIndex[3].componentRef.instance.constructor.name).toBe('LazyTestComponent');
        expect(comp.hookIndex[3].componentRef.instance.name).toBe('sleepy');

        // Make sure that onDynamicChanges has triggered again (with contentChildren)
        expect(comp.hookIndex[2].componentRef.instance.onDynamicChanges['calls'].count()).toBe(1);
        expect(comp.hookIndex[2].componentRef.instance.changesContext).toEqual(context);
        expect(comp.hookIndex[2].componentRef.instance.changesContentChildren.length).toBe(1);
        expect(comp.hookIndex[2].componentRef.instance.changesContentChildren[0].componentSelector).toBe('dynhooks-lazytest');

        // Make sure that onDynamicMount has triggered
        expect(comp.hookIndex[2].componentRef.instance.onDynamicMount['calls'].count()).toBe(1);
        expect(comp.hookIndex[2].componentRef.instance.mountContext).toEqual(context);
        expect(comp.hookIndex[2].componentRef.instance.mountContentChildren.length).toBe(1);
        expect(comp.hookIndex[2].componentRef.instance.mountContentChildren[0].componentSelector).toBe('dynhooks-lazytest');

        // ComponentsLoaded should have emitted now and contain the lazy-loaded component
        expect(loadedComponents.length).toBe(4);

        expect(loadedComponents[0].hookId).toBe(1);
        expect(loadedComponents[0].hookValue as any).toEqual({openingTag: `<dynhooks-singletagtest [stringPropAlias]="'something'">`, closingTag: null});
        expect(loadedComponents[0].hookParser).toBeDefined();
        expect(loadedComponents[0].componentRef.instance.stringProp).toBe('something');

        expect(loadedComponents[1].hookId).toBe(2);
        expect(loadedComponents[1].hookValue).toEqual({openingTag: `<dynhooks-multitagtest [nr]="4">`, closingTag: `</dynHooks-multitagtest>`});
        expect(loadedComponents[1].hookParser).toBeDefined();
        expect(loadedComponents[1].componentRef.instance.nr).toBe(4);

        expect(loadedComponents[2].hookId).toBe(3);
        expect(loadedComponents[2].hookValue).toEqual({openingTag: `<dynhooks-lazytest [name]="'sleepy'">`, closingTag: `</dynhooks-lazytest>`});
        expect(loadedComponents[2].hookParser).toBeDefined();
        expect(loadedComponents[2].componentRef.instance.name).toBe('sleepy');

        expect(loadedComponents[3].hookId).toBe(4);
        expect(loadedComponents[3].hookValue).toEqual({openingTag: `<dynhooks-inlinetest [nr]="87">`, closingTag: `</dynhooks-inlinetest>`});
        expect(loadedComponents[3].hookParser).toBeDefined();
        expect(loadedComponents[3].componentRef.instance.nr).toBe(87);

        done();
      }, 100);
    }
  });

  it('#should destroy loaded components when destroyed itself', () => {
    const testText = `
      <dynhooks-singletagtest [stringPropAlias]="'This is the first loaded component'">
      <dynhooks-multitagtest></dynhooks-multitagtest>
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(Object.keys(comp.hookIndex).length).toBe(2);
    const firstCompRef = comp.hookIndex[1].componentRef;
    const secondCompRef = comp.hookIndex[2].componentRef;
    spyOn(firstCompRef, 'destroy').and.callThrough();
    spyOn(secondCompRef, 'destroy').and.callThrough();

    expect(firstCompRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(secondCompRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(firstCompRef.instance.stringProp).toBe('This is the first loaded component');
    expect((firstCompRef as any).destroy['calls'].count()).toBe(0);
    expect((secondCompRef as any).destroy['calls'].count()).toBe(0);

    // Destroy outlet comnponent
    comp.ngOnDestroy();

    expect(fixture.nativeElement.innerHTML).toBe('');
    expect(Object.keys(comp.hookIndex).length).toBe(0);
    expect((firstCompRef as any).destroy['calls'].count()).toBe(1);
    expect((secondCompRef as any).destroy['calls'].count()).toBe(1);
  });

  // 4. Bindings
  // --------------------------------------------------------------------------

  it('#should parse inputs properly', () => {
    const testText = `
    <dynhooks-multitagtest [fonts]="['test', 'something', 'here']"></dynhooks-multitagtest>
    <dynhooks-singletagtest
      id="someid"
      id-with-hyphen="something"
      inputWithoutBrackets="{test: 'Hullo!'}"
      [_weird5Input$Name13]="'Even names like this should be recognized.'"
      [nonInputProperty]="'this should not be set as input'"
      [stringPropAlias]="'this is just a test string'"
      data-somevalue="this is a data value"
      [numberProp]="846"
      [booleanProp]="true"
      [nullProp]="null"
      [undefinedProp]='undefined'
      [simpleObject]='{config: {lightbox: false, size: {width: "200px", height: "100px"}}}'
      [simpleArray]="[1, 2, 'three', true, undefined, null, [5, 6]]"
      [variable]='context["$lightS\\aberCollection"][2]'
      [variableLookalike]='"seems like a var, but isnt: [{context.thisShouldntBeRecognizedAsAVariable}]"'
      [variableInObject]='{propInObj: context["_jediCouncil"].kiAdiMundi[8]["planet"]}'
      [variableInArray]='["melon", context["_jediCouncil"].yoda900, 798]'
      [contextWithoutAnything]="context"
      [nestedFunctions]="{dangerousStr: 'heres a couple of (dangerous) , chars', functionsProp: [context.maneuvers.combo(context.maneuvers.defend('Leia'), context.maneuvers.attack(context.maneuvers.generateEnemy('Wampa')['name']))]}"
      [nestedFunctionsInBrackets]="[
        context.maneuvers[context['maneuvers'].findAppropriateAction(context.maneuvers.getMentalState())]().action,
        context['maneuvers'][context.maneuvers['findAppropriateAction']('peaceful')]().state
      ]"
      [everythingTogether]="[
        'Jar-Jar Binks',
        35,
        {
          someObjProp: [
            true,
            \`hello\`,
            null,
            76,
            '02:46am',
            context.greeting
          ]
        },
        [
          'another',
          'variable',
          context._jediCouncil.skywalker,
          'laststring',
          {
            complexFunctionCall: context.maneuvers[context['maneuvers'].findAppropriateAction(context.maneuvers.getMentalState())]().state
          }
        ]
      ]"
    >
    <p>This should be untouched</p>
    <dynhooks-inlinetest [nr]="123" [config]="{name: 'test', supportedValues: [1, 2, 3], active: true}"></dynhooks-inlinetest>`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    const firstComp: MultiTagTestComponent = comp.hookIndex[1].componentRef.instance;
    const secondComp: SingleTagTestComponent = comp.hookIndex[2].componentRef.instance;
    const thirdComp: InlineTestComponent = comp.hookIndex[3].componentRef.instance;

    // Make sure components are loaded properly
    expect(Object.keys(comp.hookIndex).length).toBe(3);
    expect(firstComp.constructor.name).toBe('MultiTagTestComponent');
    expect(secondComp.constructor.name).toBe('SingleTagTestComponent');
    expect(thirdComp.constructor.name).toBe('InlineTestComponent');
    expect(fixture.nativeElement.children[2].innerHTML.trim()).toBe('This should be untouched');

    // Check all inputs
    expect(firstComp.fonts).toEqual(['test', 'something', 'here']);

    expect((secondComp as any)['id']).toBe(undefined);
    expect(secondComp.inputWithoutBrackets).toBe("{test: 'Hullo!'}");
    expect(secondComp._weird5Input$Name13).toBe('Even names like this should be recognized.');
    expect(secondComp.nonInputProperty).toBe('this is the default value');
    expect(secondComp.stringProp).toBe('this is just a test string');
    expect(secondComp.dataSomeValue).toBe('this is a data value');
    expect(secondComp.numberProp).toBe(846);
    expect(secondComp.booleanProp).toBe(true);
    expect(secondComp.nullProp).toBe(null);
    expect(secondComp.undefinedProp).toBe(undefined);
    expect(secondComp.simpleObject).toEqual({
      config: {
        lightbox: false,
        size: {
          height: '100px',
          width: '200px'
        }
      }
    });
    expect(secondComp.simpleArray).toEqual([1, 2, 'three', true, null, null, [5, 6]]);
    expect(secondComp.variable).toBe('orange');
    expect(secondComp.variableLookalike).toBe('seems like a var, but isnt: [{context.thisShouldntBeRecognizedAsAVariable}]');
    expect(secondComp.variableInObject).toEqual({
      propInObj: 'kashyyyk'
    });
    expect(secondComp.variableInArray).toEqual(['melon', 'there is no try', 798]);
    expect(secondComp.contextWithoutAnything).toEqual(context);
    expect(secondComp.nestedFunctions).toEqual({
      dangerousStr: 'heres a couple of (dangerous) , chars',
      functionsProp: ['Combo: defending Leia! and attacking the evil Wampa!']
    });
    expect(secondComp.nestedFunctionsInBrackets).toEqual([
      'meditating!', 'vigilant'
    ]);
    expect(secondComp.everythingTogether).toEqual([
      'Jar-Jar Binks',
      35,
      {
        someObjProp: [
          true,
          'hello',
          null,
          76,
          '02:46am',
          'Hello there!'
        ]
      }, [
        'another',
        'variable',
        undefined,
        'laststring',
        {
          complexFunctionCall: 'calm'
        }
      ]
    ]);

    expect(thirdComp.nr).toBe(123);
    expect(thirdComp.config).toEqual({name: 'test', supportedValues: [1, 2, 3], active: true});
  });

  it('#should not accept forbidden inputs', () => {
    const testText = `<dynhooks-singletagtest [prototype]="false">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {acceptInputsForAnyProperty: true};
    comp.ngOnChanges({content: true, context: true, options: true});

    const loadedComp: SingleTagTestComponent = comp.hookIndex[1].componentRef.instance;
    expect(loadedComp as any['prototype']).not.toBe(false);
  });

  it('#should parse outputs properly', () => {
    const testText = `<dynhooks-singletagtest [numberProp]="123" (componentClickedAlias)="context.maneuvers.modifyParent($event)">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    
    expect((comp as any)['completelyNewProperty']).toBeUndefined();
    comp.hookIndex[1].componentRef.instance.componentClicked.emit(555);
    expect((comp as any)['completelyNewProperty']).toBe(555);
  });

  it('#should catch errors if output string cannot be evaluated', () => {
    spyOn(console, 'error').and.callThrough();
    const testText = `<dynhooks-singletagtest (componentClickedAlias)="context.maneuvers.modifyParent($event">`; // Missing final bracket
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});

    expect((comp as any)['completelyNewProperty']).toBeUndefined();
    comp.hookIndex[1].componentRef.instance.componentClicked.emit(555);
    expect((comp as any)['completelyNewProperty']).toBe(undefined);
    expect((<any>console.error)['calls'].count(1));
  });

  // 5. OutletOptions
  // --------------------------------------------------------------------------

  it('#should load global options correctly', () => {
    const differentOptions: any = {};
    for (const [key, value] of Object.entries(outletOptionDefaults)) {
      if (typeof value === 'boolean') { differentOptions[key] = !value; }
      else if (typeof value === 'number') { differentOptions[key] = value * 2; }
      else if (typeof value === 'string') { differentOptions[key] = value; }
      else {  differentOptions[key] = null; }
    }

    ({fixture, comp} = prepareTestingModule(testParsers, differentOptions));

    comp.content = 'something';
    comp.ngOnChanges({content: true});

    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toBe(differentOptions[key]);
    }
  });

  it('#should load local options correctly', () => {
    const differentOptions: any = {};
    for (const [key, value] of Object.entries(outletOptionDefaults)) {
      if (typeof value === 'boolean') { differentOptions[key] = !value; }
      else if (typeof value === 'number') { differentOptions[key] = value * 2; }
      else if (typeof value === 'string') { differentOptions[key] = value; }
      else {  differentOptions[key] = null; }
    }

    comp.options = differentOptions as OutletOptions;
    comp.ngOnChanges({content: true, options: true});

    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toBe(differentOptions[key]);
    }
  });

  it('#should ignore invalid options', () => {
    const invalidOptions = {
      invalidOption: true
    };

    comp.options = invalidOptions as OutletOptions;
    comp.ngOnChanges({content: true, options: true});

    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toBe((outletOptionDefaults as any)[key]);
    }
  });

  it('#should load fine without options', () => {
    ({fixture, comp} = prepareTestingModule(testParsers, []));

    comp.content = 'something';
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.innerHTML.trim()).toBe('something');
    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toBe((outletOptionDefaults as any)[key]);
    }
  });

  it('#should sanitize, if requested', () => {
    const testText = `
    <script>console.log("somescript");</script>
    <p id="someId" style="color: blue" onclick="return 'someString'">
      Here is a simple component
      <dynHooks-singletagtest [simpleObject]="{testProp: 123, otherProp: true}">
      <custom-element></custom-element>
    </p>`;
    comp.content = testText;
    comp.options = { sanitize: true };
    comp.ngOnChanges({content: true, options: true});

    // Ensure that sanitized
    expect(fixture.nativeElement.innerHTML).not.toContain('<script>');
    let pEl = fixture.nativeElement.querySelector('p');
    expect(pEl.getAttribute('id')).toBeNull();
    expect(pEl.getAttribute('style')).toBeNull();
    expect(pEl.onclick).toBeNull();
    let customEl = fixture.nativeElement.querySelector('custom-element');
    expect(customEl).toBeNull();
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.simpleObject).toEqual({testProp: 123, otherProp: true});

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { sanitize: false };
    comp.ngOnChanges({content: true, options: true});

    // Ensure that unsanitized
    expect(fixture.nativeElement.innerHTML).toContain('<script>console.log("somescript");</script>');
    pEl = fixture.nativeElement.querySelector('p');
    expect(pEl.getAttribute('id')).toBe('someId');
    expect(pEl.getAttribute('style')).toBe('color: blue');
    expect(pEl.onclick()).toBe('someString');
    customEl = fixture.nativeElement.querySelector('custom-element');
    expect(customEl).not.toBeNull();
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.simpleObject).toEqual({testProp: 123, otherProp: true});
  });

  it('#should convertHTMLEntities, if requested', () => {
    const testText = `
      The following word has encoded b-tags: &lt;b&gt;BOLD&lt;/b&gt;.
      This hook is using html entities as well: &lt;dynhooks-singletagtest [numberProp]=&quot;21&quot; [simpleArray]='[&quot;enrico&quot;,&nbsp;&quot;susanne&quot;]'&gt;
    `;
    comp.content = testText;
    comp.options = { convertHTMLEntities: true, sanitize: false };
    comp.ngOnChanges({content: true, options: true});

    // Ensure that HTML-Entities are replaced
    expect(fixture.nativeElement.querySelector('b')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.numberProp).toBe(21);
    expect(comp.hookIndex[1].componentRef.instance.simpleArray).toEqual(['enrico', 'susanne']);

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { convertHTMLEntities: false, sanitize: false };
    comp.ngOnChanges({content: true, options: true});

    // Ensure that HTML-Entities are not replaced
    expect(fixture.nativeElement.innerHTML).toContain('&lt;b&gt;BOLD&lt;/b&gt;');
    expect(Object.keys(comp.hookIndex).length).toBe(0);
  });

  it('#should fixParagraphTags, if requested', () => {
    const testText = `
      <p>Textbox in seperate HTML-tags, with contained HTML:</p>
      <p><dynhooks-multitagtest id="'seperate-tags'"></p>
        <span>This is some text</span>
        <ul>
          <li>menu point 1</li>
          <li>menu point 2</li>
        </ul>
        loose text
      <p></dynhooks-multitagtest></p>
    `;
    comp.content = testText;
    comp.options = { fixParagraphTags: true };
    comp.ngOnChanges({content: true, options: true});

    // Ensure that p-artifacts are removed
    expect(fixture.nativeElement.children.length).toBe(2);
    expect(fixture.nativeElement.children[0].tagName).toBe('P');
    expect(fixture.nativeElement.children[0].textContent).toBe('Textbox in seperate HTML-tags, with contained HTML:');
    expect(fixture.nativeElement.children[1].tagName).toBe('DYNHOOKS-MULTITAGTEST');
    expect(fixture.nativeElement.children[1].children.length).toBe(1);
    expect(fixture.nativeElement.children[1].children[0].className).toBe('multitag-component');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { fixParagraphTags: false };
    comp.ngOnChanges({content: true, options: true});

    // Ensure that p-artifacts are not replaced
    // Any number of things can be wrong when letting the browser parse invalid HTML
    // Not trying to make this check too specific.
    expect(fixture.nativeElement.children.length).not.toBe(2);
  });

  it('#should update on push only, if requested', () => {
    const testText = `<dynhooks-singletagtest>`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: true};
    comp.ngOnChanges({content: true, context: true, options: true});
    spyOn<any>(comp['componentUpdater'], 'refresh').and.callThrough();

    // Ensure that hooks are refreshed on context reference change only
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(0);
    comp.context.order = 99;
    comp.ngDoCheck();
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(0);
    comp.context = context;
    comp.ngOnChanges({context: true});
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(1);

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true});
    spyOn<any>(comp['componentUpdater'], 'refresh').and.callThrough();

    // Ensure that hooks are refreshed on any change detection run
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(0);
    comp.context.order = 99;
    comp.ngDoCheck();
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(1);
  });

  it('#should compareInputsByValue, if requested', () => {
    // Clone $lightSaberCollection, so it has a difference reference, but the same content
    // Note: Changing a bound context variable so that a ===-comparison returns false with its previous value will cause
    // the SelectorHookParser to reparse the whole binding, thus changing the reference.
    const newContext = {$lightSaberCollection: [...context.$lightSaberCollection]};
    const testText = `<dynhooks-singletagtest [simpleObject]="{lightsabers: context.$lightSaberCollection}">`;

    comp.content = testText;
    comp.context = context;
    comp.options = { compareInputsByValue: true };
    comp.ngOnChanges({content: true, context: true, options: true});
    let loadedComp = comp.hookIndex[1].componentRef.instance;
    let simpleObject = loadedComp.simpleObject;
    spyOn<any>(comp['componentUpdater'], 'refresh').and.callThrough();
    spyOn<any>(loadedComp, 'ngOnChanges').and.callThrough();

    // With compareByValue: Expect ngOnChanges not to trigger and inputs not to be replaced if value stays the same (even if ref changes)
    comp.context = newContext;
    comp.ngOnChanges({context: true});
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(1);
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(0);
    expect(loadedComp.simpleObject).toBe(simpleObject);                                 // Should NOT have been replaced
    expect(loadedComp.simpleObject.lightsabers).toBe(context.$lightSaberCollection);    // Should NOT have been replaced

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.context = context;
    comp.options = { compareInputsByValue: false };
    comp.ngOnChanges({content: true, context: true, options: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;
    simpleObject = loadedComp.simpleObject;
    spyOn<any>(comp['componentUpdater'], 'refresh').and.callThrough();
    spyOn<any>(loadedComp, 'ngOnChanges').and.callThrough();

    // Without compareByValue: Expect ngOnChanges to trigger and inputs to be replaced if reference changes
    comp.context = newContext;
    comp.ngOnChanges({context: true});
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(1);
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(1);
    expect(Object.keys(loadedComp.ngOnChanges['calls'].mostRecent().args[0]).length).toBe(1);
    expect(loadedComp.ngOnChanges['calls'].mostRecent().args[0]['simpleObject']).toBeDefined();
    expect(loadedComp.simpleObject).not.toBe(simpleObject);                                 // Should have been replaced
    expect(loadedComp.simpleObject.lightsabers).toBe(newContext.$lightSaberCollection);     // Should have been replaced
  });

  it('#should fallback on comparison by ref if inputs cannot be compared by value', () => {
    const componentUpdater = comp['componentUpdater'];
    const testHook = {
      componentRef: {componentType: {name: 'someComponent'}},
      bindings: {inputs: {testInput: true}},
      previousBindings: {inputs: {testInput: {
        reference: false,
        stringified: {
          result: null,
          depthReachedCount: 0
        }
      }}}
    };

    const changedBindings = componentUpdater.getChangedBindings(testHook as any, 'inputs', true, 5);
    expect(changedBindings.testInput).not.toBeUndefined();
  });

  it('#should warn if inputs cannot be compared by value', () => {
    const componentUpdater = comp['componentUpdater'];
    spyOn(console, 'warn').and.callThrough();

    let oldResult: any = {result: null, depthReachedCount: 0};
    let newResult: any = {result: null, depthReachedCount: 0};
    componentUpdater.checkDetailedStringifyResultPair('someBinding', 'someComponent', 5, oldResult, newResult);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('Could stringify neither new nor old value for hook binding "someBinding" for component "someComponent" to compare by value. Defaulting to comparison by reference instead.');

    oldResult = {result: null, depthReachedCount: 0};
    newResult = {result: true, depthReachedCount: 0};
    componentUpdater.checkDetailedStringifyResultPair('someBinding', 'someComponent', 5, oldResult, newResult);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('Could not stringify old value for hook binding "someBinding" for component "someComponent" to compare by value. Defaulting to comparison by reference instead.');

    oldResult = {result: true, depthReachedCount: 0};
    newResult = {result: null, depthReachedCount: 0};
    componentUpdater.checkDetailedStringifyResultPair('someBinding', 'someComponent', 5, oldResult, newResult);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('Could not stringify new value for hook binding "someBinding" for component "someComponent" to compare by value. Defaulting to comparison by reference instead.');

    oldResult = {result: true, depthReachedCount: 1};
    newResult = {result: true, depthReachedCount: 1};
    componentUpdater.checkDetailedStringifyResultPair('someBinding', 'someComponent', 5, oldResult, newResult);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toContain('Maximum compareByValueDepth of');

    oldResult = {result: true, depthReachedCount: 0};
    newResult = {result: true, depthReachedCount: 1};
    componentUpdater.checkDetailedStringifyResultPair('someBinding', 'someComponent', 5, oldResult, newResult);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toContain('Maximum compareByValueDepth of');

    oldResult = {result: true, depthReachedCount: 1};
    newResult = {result: true, depthReachedCount: 0};
    componentUpdater.checkDetailedStringifyResultPair('someBinding', 'someComponent', 5, oldResult, newResult);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toContain('Maximum compareByValueDepth of');
  });

  it('#should apply the desired compareByValueDepth', () => {
    const firstContext = {someObj: {firstLevel: {secondLevel: {thirdLevel: {someValue: 5 }}}}};
    const secondContext = {someObj: {firstLevel: {secondLevel: {thirdLevel: {someValue: 10 }}}}};

    const testText = `<dynhooks-singletagtest [simpleObject]="context.someObj">`;
    comp.content = testText;
    comp.context = firstContext;
    comp.options = { compareInputsByValue: true, compareByValueDepth: 3 };
    comp.ngOnChanges({content: true, context: true, options: true});
    let loadedComp = comp.hookIndex[1].componentRef.instance;
    spyOn<any>(loadedComp, 'ngOnChanges').and.callThrough();

    // Expect ngOnChanges not to trigger if changed value is out of reach
    comp.context = secondContext;
    comp.ngOnChanges({context: true});
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(0);

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.context = firstContext;
    comp.options = { compareInputsByValue: true, compareByValueDepth: 4 };
    comp.ngOnChanges({content: true, context: true, options: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;
    spyOn<any>(loadedComp, 'ngOnChanges').and.callThrough();

    // Expect ngOnChanges to trigger if changed value is within reach
    comp.context = secondContext;
    comp.ngOnChanges({context: true});
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(1);
  });

  it('#should ignoreInputAliases, if requested', () => {
    const testText = `<dynhooks-singletagtest [stringPropAlias]="'Hello there'" [stringProp]="'General Kenobi'">`;
    comp.content = testText;
    comp.options = { ignoreInputAliases: true };
    comp.ngOnChanges({content: true, options: true});
    let loadedComp = comp.hookIndex[1].componentRef.instance;

    // Expect input property to be set by its property name
    expect(loadedComp.stringProp).toBe('General Kenobi');

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { ignoreInputAliases: false };
    comp.ngOnChanges({content: true, options: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;

    // Expect input property to be set by its alias
    expect(loadedComp.stringProp).toBe('Hello there');
  });

  it('#should ignoreOutputAliases, if requested', () => {
    const testText = `<dynhooks-singletagtest (eventTriggeredAlias)="123" (componentClicked)="456">`;
    comp.content = testText;
    comp.options = { ignoreOutputAliases: true };
    comp.ngOnChanges({content: true, options: true});
    let loadedComp = comp.hookIndex[1].componentRef.instance;

    // Expect output property to be set by its property name
    expect(comp.hookIndex[1].outputSubscriptions['componentClicked']).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions['eventTriggered']).toBeUndefined();

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { ignoreOutputAliases: false };
    comp.ngOnChanges({content: true, options: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;

    // Expect output property to be set by its alias
    expect(comp.hookIndex[1].outputSubscriptions['componentClicked']).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions['eventTriggered']).toBeDefined();
  });

  it('#should acceptInputsForAnyProperty, if requested', () => {
    const testText = `<dynhooks-singletagtest [thisPropertyDoesNotExist]="123">`;
    comp.content = testText;
    comp.options = { acceptInputsForAnyProperty: true };
    comp.ngOnChanges({content: true, options: true});
    let loadedComp = comp.hookIndex[1].componentRef.instance;

    // Expect property to be set regardless of whether or not it is declared as @Input() or not
    expect(loadedComp.thisPropertyDoesNotExist).toBe(123);

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { acceptInputsForAnyProperty: false };
    comp.ngOnChanges({content: true, options: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;

    // Expect property not to be set when not declared as @Input()
    expect(loadedComp.thisPropertyDoesNotExist).toBeUndefined();
  });

  it('#should acceptOutputsForAnyObservable, if requested', () => {
    const testText = `<dynhooks-singletagtest (nonOutputEventEmitter)="123">`;
    comp.content = testText;
    comp.options = { acceptOutputsForAnyObservable: true };
    comp.ngOnChanges({content: true, options: true});

    // Expect property to be set regardless of whether or not it is declared as @Output() or not
    expect(comp.hookIndex[1].outputSubscriptions['nonOutputEventEmitter']).toBeDefined();

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { acceptOutputsForAnyObservable: false };
    comp.ngOnChanges({content: true, options: true});

    // Expect property not to be set when not declared as @Output()
    expect(comp.hookIndex[1].outputSubscriptions['nonOutputEventEmitter']).toBeUndefined();
  });

  // 6. SelectorHookParser bindings
  // --------------------------------------------------------------------------

  it('#should track all hooks and their bindings with used context variables', () => {
    const testText = `
      <p>Let's test this with two singletag-components</p>
      <dynhooks-singletagtest [simpleObject]="{something: true, contextVar: context.order, nestedArray: [context.$lightSaberCollection]}" [simpleArray]="[true]" (httpResponseReceived)="context.maneuvers.meditate()">
      <dynhooks-singletagtest [numberProp]="567">
      <p>And a multitagcomponent</p>
      <dynhooks-multitagtest [fonts]="['arial', context.greeting]"></dynhooks-multitagtest>
    `;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});

    // singletag hooks
    const singleTagBindings = (comp as any).activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings).length).toBe(2);

    // First singletag:
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(2);
    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe('{something: true, contextVar: context.order, nestedArray: [context.$lightSaberCollection]}');
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: true, contextVar: context.order, nestedArray: [context.$lightSaberCollection]});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(2);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.order']).toBe(66);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toEqual(context.$lightSaberCollection);

    expect(singleTagBindings[1].inputs['simpleArray'].raw).toBe('[true]');
    expect(singleTagBindings[1].inputs['simpleArray'].value).toEqual([true]);
    expect(Object.keys(singleTagBindings[1].inputs['simpleArray'].boundContextVariables).length).toBe(0);

    expect(Object.keys(singleTagBindings[1].outputs).length).toBe(1);
    expect(singleTagBindings[1].outputs['httpResponseReceived'].raw).toBe('context.maneuvers.meditate()');
    expect(typeof singleTagBindings[1].outputs['httpResponseReceived'].value).toBe('function');
    expect(Object.keys(singleTagBindings[1].outputs['httpResponseReceived'].boundContextVariables).length).toBe(0);

    // Second singletag:
    expect(Object.keys(singleTagBindings[2].inputs).length).toBe(1);
    expect(singleTagBindings[2].inputs['numberProp'].raw).toBe('567');
    expect(singleTagBindings[2].inputs['numberProp'].value).toBe(567);
    expect(Object.keys(singleTagBindings[2].inputs['numberProp'].boundContextVariables).length).toBe(0);

    // multitag hooks
    const multiTagBindings = (comp as any).activeParsers[1]['currentBindings'];
    expect(Object.keys(multiTagBindings).length).toBe(1);

    // First multitag:
    expect(Object.keys(multiTagBindings[3].inputs).length).toBe(1);
    expect(multiTagBindings[3].inputs['fonts'].raw).toBe(`['arial', context.greeting]`);
    expect(multiTagBindings[3].inputs['fonts'].value).toEqual(['arial', context.greeting]);
    expect(Object.keys(multiTagBindings[3].inputs['fonts'].boundContextVariables).length).toBe(1);
    expect(multiTagBindings[3].inputs['fonts'].boundContextVariables['context.greeting']).toBe(context.greeting);
  });

  it('#should remove bindings that cannot be parsed', () => {
    const testText = `<dynhooks-singletagtest [numberProp]="12345" [simpleObject]="{color: 'blue', speed: 100">`; // <-- object has missing closing tag
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});

    // simpleObject should not be tracked
    const singleTagBindings = (comp as any).activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['numberProp'].value).toBe(12345);
  });

  it('#should preserve binding references on update if binding is static', () => {
    const testText = `<dynhooks-singletagtest [simpleObject]="{something: true, extra: 'hi, this is a string!'}">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true});

    // Check bindings
    const singleTagBindings = (comp as any).activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe("{something: true, extra: 'hi, this is a string!'}");
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: true, extra: "hi, this is a string!"});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(0);

    spyOn(comp.activeParsers[0], 'getBindings').and.callThrough();
    const previousRef = singleTagBindings[1].inputs['simpleObject'].value;

    // Trigger cd
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect((comp as any).activeParsers[0].getBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].value).toBe(previousRef);
  });

  it('#should preserve binding references on update if binding has bound context vars, but they have not changed', () => {
    const testText = `<dynhooks-singletagtest [simpleObject]="{something: context.$lightSaberCollection}">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true});

    // Check bindings
    const singleTagBindings = (comp as any).activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    spyOn(comp.activeParsers[0], 'getBindings').and.callThrough();
    const previousRef = singleTagBindings[1].inputs['simpleObject'].value;

    // Trigger cd
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect((comp as any).activeParsers[0].getBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].value).toBe(previousRef);
  });

  it('#should preserve binding references on update if binding has bound context vars, and only their content has changed', () => {
    const testText = `<dynhooks-singletagtest [simpleObject]="{something: context.$lightSaberCollection}">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true});

    // Check bindings
    const singleTagBindings = (comp as any).activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    spyOn(comp.activeParsers[0], 'getBindings').and.callThrough();
    const previousRef = singleTagBindings[1].inputs['simpleObject'].value;

    // Change content and trigger cd
    context.$lightSaberCollection.push('cyan');
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect((comp as any).activeParsers[0].getBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].value).toBe(previousRef);
  });

  it('#should change binding references on update if binding has bound context vars and they have changed', () => {
    const testText = `<dynhooks-singletagtest [simpleArray]="[context.order]" [simpleObject]="{something: context.$lightSaberCollection}" (httpResponseReceived)="content.maneuvers.getMentalState()">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true});

    // Check bindings
    const singleTagBindings = (comp as any).activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(2);

    expect(singleTagBindings[1].inputs['simpleArray'].raw).toBe("[context.order]");
    expect(singleTagBindings[1].inputs['simpleArray'].value).toEqual([context.order]);
    expect(Object.keys(singleTagBindings[1].inputs['simpleArray'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleArray'].boundContextVariables['context.order']).toBe(context.order);

    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    expect(singleTagBindings[1].outputs['httpResponseReceived'].raw).toBe('content.maneuvers.getMentalState()');
    expect(typeof singleTagBindings[1].outputs['httpResponseReceived'].value).toBe('function');
    expect(Object.keys(singleTagBindings[1].outputs['httpResponseReceived'].boundContextVariables).length).toBe(0); // Can't be known until the event triggers

    spyOn(comp.activeParsers[0], 'getBindings').and.callThrough();

    // Change bound property and trigger cd
    let previousArrayRef = singleTagBindings[1].inputs['simpleArray'].value;
    let previousObjectRef = singleTagBindings[1].inputs['simpleObject'].value;
    let previousOutputRef = singleTagBindings[1].outputs['httpResponseReceived'].value;
    context.order = 77;
    context.$lightSaberCollection = ['cyan', 'viridian', 'turquoise'];
    context.maneuvers.getMentalState = () => 'happy';
    comp.ngDoCheck();

    // Parser should have changed binding reference on reevaluation
    expect((comp as any).activeParsers[0].getBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[1].inputs['simpleArray'].value).not.toBe(previousArrayRef);
    expect(singleTagBindings[1].inputs['simpleObject'].value).not.toBe(previousObjectRef);
    expect(singleTagBindings[1].outputs['httpResponseReceived'].value).toBe(previousOutputRef); // Output wrapper func refs should never change

    // Test identical by value:
    // If object, binding reference should change even if new context prop is identical by value, as the reference is still different.
    // If primitive, binding reference should not change if identical as they are not compared by reference.
    previousArrayRef = singleTagBindings[1].inputs['simpleArray'].value;
    previousObjectRef = singleTagBindings[1].inputs['simpleObject'].value;
    context.order = 77;
    context.$lightSaberCollection = ['cyan', 'viridian', 'turquoise'];
    comp.ngDoCheck();
    expect((comp as any).activeParsers[0].getBindings['calls'].count()).toBe(2);
    expect(singleTagBindings[1].inputs['simpleArray'].value).toBe(previousArrayRef);
    expect(singleTagBindings[1].inputs['simpleObject'].value).not.toBe(previousObjectRef);
  });

  it('#should replace (currently) invalid context vars with undefined, but fix them when they become available', () => {
    const testText = `<dynhooks-singletagtest [simpleObject]='{validContextVar: context._jediCouncil.kenobi, invalidContextVar: context.sithTriumvirate.kreia}'>`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true});

    // One of them should be undefined
    const loadedComp = comp.hookIndex[1].componentRef.instance;
    expect(loadedComp.simpleObject).toEqual({validContextVar: context._jediCouncil.kenobi, invalidContextVar: undefined});

    // Should automatically fix itself when context var becomes available
    spyOn(loadedComp, 'ngOnChanges').and.callThrough();
    comp.context['sithTriumvirate'] = {kreia: 'you are blind'};
    comp.ngDoCheck();
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(1);
    expect(Object.keys(loadedComp.ngOnChanges['calls'].mostRecent().args[0]).length).toBe(1);
    expect(loadedComp.ngOnChanges['calls'].mostRecent().args[0]['simpleObject']).toBeDefined();
    expect(loadedComp.simpleObject).toEqual({validContextVar: context._jediCouncil.kenobi, invalidContextVar: 'you are blind'});
  });

  // 7. SelectorHookParserConfig
  // --------------------------------------------------------------------------

  it('#should throw errors on invalid parser configs', () => {
    // In general, should not include parsers with invalid configs
    spyOn(console, 'error').and.callThrough();
    comp.parsers = [{
      component: SingleTagTestComponent,
      selector: true
    } as any];
    comp.ngOnChanges({content: true, context: true});

    expect(comp.activeParsers.length).toBe(0);
    expect((<any>console.error)['calls'].count()).toBe(1);

    // Get instance of SelectorHookParserConfigResolver for faster, more detailed tests
    const configResolver = comp['outletService']['parserEntryResolver']['parserResolver'];

    // No config
    let config: any = null;
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('Missing the required "component" property for the SelectorHookParserConfig. Must be either the component class or a LazyLoadComponentConfig.'));

    // Lazy-loading config without selector
    config = {
      component: {importPromise: () => new Promise(() => {}), importName: 'someComponent'}
    };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error(`When using lazy-loaded dynamic components, you have to specify the "selector" property in the parser config (that will be used to find it in the text), as the real selector can't be known before the component is loaded.`));

    // Wrong component type
    config = { component: true };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The "component" property in the SelectorHookParserConfig must either contain the component class or a LazyLoadComponentConfig.'));

    // Wrong name type
    config = { component: SingleTagTestComponent, name: true };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "name" property in the SelectorHookParserConfig must be of type string, was boolean'));

    // Wrong selector type
    config = { component: SingleTagTestComponent, selector: true };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "selector" property in the SelectorHookParserConfig must be of type string, was boolean'));

    // Wrong selector type
    config = { component: SingleTagTestComponent, enclosing: 'true' };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "enclosing" property in the SelectorHookParserConfig must be of type boolean, was string'));

    // Wrong backet style type
    config = { component: SingleTagTestComponent, bracketStyle: {brackets: '<>'} };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "bracketStyle" property in the SelectorHookParserConfig must have the form {opening: string, closing: string}'));

    // Wrong unescapeStrings type
    config = { component: SingleTagTestComponent, unescapeStrings: 'true' };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "unescapeStrings" property in the SelectorHookParserConfig must be of type boolean, was string'));

    // Wrong parseInputs type
    config = { component: SingleTagTestComponent, parseInputs: 'true' };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "parseInputs" property in the SelectorHookParserConfig must be of type boolean, was string'));

    // Wrong inputsBlacklist type
    config = { component: SingleTagTestComponent, inputsBlacklist: true };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "inputsBlacklist" property in the SelectorHookParserConfig must be an array of strings.'));

    // Wrong inputsBlacklist entry type
    config = { component: SingleTagTestComponent, inputsBlacklist: [true] };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('All entries of the submitted "inputsBlacklist" property in the SelectorHookParserConfig must be of type string, boolean found.'));

    // Wrong inputsWhitelist type
    config = { component: SingleTagTestComponent, inputsWhitelist: true };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "inputsWhitelist" property in the SelectorHookParserConfig must be an array of strings.'));

    // Wrong inputsWhitelist entry type
    config = { component: SingleTagTestComponent, inputsWhitelist: [true] };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('All entries of the submitted "inputsWhitelist" property in the SelectorHookParserConfig must be of type string, boolean found.'));

    // Wrong outputsBlacklist type
    config = { component: SingleTagTestComponent, outputsBlacklist: true };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "outputsBlacklist" property in the SelectorHookParserConfig must be an array of strings.'));

    // Wrong outputsBlacklist entry type
    config = { component: SingleTagTestComponent, outputsBlacklist: [true] };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('All entries of the submitted "outputsBlacklist" property in the SelectorHookParserConfig must be of type string, boolean found.'));

    // Wrong outputsWhitelist type
    config = { component: SingleTagTestComponent, outputsWhitelist: true };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "outputsWhitelist" property in the SelectorHookParserConfig must be an array of strings.'));

    // Wrong outputsWhitelist entry type
    config = { component: SingleTagTestComponent, outputsWhitelist: [true] };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('All entries of the submitted "outputsWhitelist" property in the SelectorHookParserConfig must be of type string, boolean found.'));

    // Wrong allowContextInBindings entry type
    config = { component: SingleTagTestComponent, allowContextInBindings: 'true' };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "allowContextInBindings" property in the SelectorHookParserConfig must be of type boolean, was string'));

    // Wrong allowContextFunctionCalls entry type
    config = { component: SingleTagTestComponent, allowContextFunctionCalls: 'true' };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "allowContextFunctionCalls" property in the SelectorHookParserConfig must be of type boolean, was string'));

  });

  it('#should recognize custom selectors', () => {
    ({fixture, comp} = prepareTestingModule([{
      component: MultiTagTestComponent,
      selector: 'atotallycustomselector'
    }]));

    const testText = `<p>This is a custom selector: <atotallycustomselector [someInput]="true">for the multitag component</atotallycustomselector>.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('for the multitag component');
  });

  it('#should recognize custom injectors', () => {
    const testText = `<dynhooks-singletagtest>`;

    // Without custom injector, fakeTestService should be null
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      enclosing: false,
    }]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    expect(comp.hookIndex[1].componentRef.instance.fakeTestService).toBeNull();

    // With custom injector, fakeTestService should be set
    const customInjector = Injector.create({
      providers: [{provide: TESTSERVICETOKEN, useValue: { name: 'test value' } }]
    });
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      enclosing: false,
      injector: customInjector
    }]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    expect(comp.hookIndex[1].componentRef.instance.fakeTestService).toEqual({ name: 'test value' });
  });

  it('#should recognize singletag hooks', () => {
    ({fixture, comp} = prepareTestingModule([{
      component: MultiTagTestComponent,
      enclosing: false
    }]));

    const testText = `<p>Here the multitag hook is set to be single tag instead: <dynhooks-multitagtest [fonts]="['arial', 'calibri']">text within hook</dynhooks-multitagtest></p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('');
    expect(fixture.nativeElement.children[0].children[0].innerHTML).not.toContain('text within hook');
    expect(fixture.nativeElement.children[0].innerHTML).toContain('text within hook');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.fonts).toEqual(['arial', 'calibri']);
  });

  it('#should recognize unique bracket styles', () => {
    ({fixture, comp} = prepareTestingModule([{
      component: MultiTagTestComponent,
      bracketStyle: {opening: '[[', closing: ']]'}
    }]));

    const testText = `<p>Here is a hook with a unique bracket style: [[dynhooks-multitagtest [fonts]="['arial', 'calibri']"]]text within hook[[/dynhooks-multitagtest]]</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('text within hook');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.fonts).toEqual(['arial', 'calibri']);
  });

  it('#should refrain from parsing inputs, if requested', () => {
    ({fixture, comp} = prepareTestingModule([{
      component: MultiTagTestComponent,
      parseInputs: false,
      refreshBindingsOnPushOnly: false
    }]));

    const testText = `<p>Here is a hook whose input shall not be parsed: <dynhooks-multitagtest [nr]="123" [fonts]="['arial', {prop: true}]">text within hook</dynhooks-multitagtest></p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('text within hook');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.nr).toEqual('123');                          // <-- Must be string, not number
    expect(comp.hookIndex[1].componentRef.instance.fonts).toEqual("['arial', {prop: true}]");   // <-- Must be string, not array

    // Expect them to still be unparsed after update
    spyOn(comp['componentUpdater'], 'refresh').and.callThrough();
    comp.ngDoCheck();
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.nr).toEqual('123');
    expect(comp.hookIndex[1].componentRef.instance.fonts).toEqual("['arial', {prop: true}]");
  });

  it('#should unescapeStrings, if requested', () => {
    const testText = `<dynhooks-singletagtest
      [stringPropAlias]="'This is a \\'test\\' string.'"
      [simpleObject]="{someProp: 'His name was O\\'Hara.'}"
      [simpleArray]="[context['maneu\\vers'].defend('O\\'Hara')]"
    >`;

    // Unescape strings
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      enclosing: false,
      unescapeStrings: true
    }]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    let loadedComp = comp.hookIndex[1].componentRef.instance;

    expect(loadedComp.stringProp).toBe("This is a 'test' string.");
    expect(loadedComp.simpleObject).toEqual({someProp: "His name was O'Hara."});
    expect(loadedComp.simpleArray).toEqual(["defending O'Hara!"]);

    // Leave strings as they are
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      enclosing: false,
      unescapeStrings: false
    }]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;

    expect(loadedComp.stringProp).toBe("This is a \\'test\\' string.");
    expect(loadedComp.simpleObject).toEqual({someProp: "His name was O\\'Hara."});
    expect(loadedComp.simpleArray).toEqual([undefined]); // Won't be able to find variable with \-chars in property name. Should default to undefined.
  });

  it('#should apply input black/whitelists and output black/whitelists', () => {
    const testText = `
      <dynhooks-singletagtest
        [stringPropAlias]="'this is an example string'"
        [numberProp]="917"
        [simpleArray]="[123, true, 'test']"
        (componentClickedAlias)="123"
        (eventTriggeredAlias)="456"
        (httpResponseReceived)="789"
      >
    `;

    // a) Test inputBlacklist
    ({fixture, comp} = prepareTestingModule([{component: SingleTagTestComponent, enclosing: false, inputsBlacklist: ['numberProp']}]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    let loadedComp = comp.hookIndex[1].componentRef.instance;

    expect(loadedComp.stringProp).toBe('this is an example string');
    expect(loadedComp.numberProp).toBeUndefined();
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[1].outputSubscriptions.componentClicked).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions.eventTriggered).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions.httpResponseReceived).toBeDefined();

    // b) Test inputWhitelist
    ({fixture, comp} = prepareTestingModule([{component: SingleTagTestComponent, enclosing: false, inputsWhitelist: ['simpleArray']}]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;

    expect(loadedComp.stringProp).toBeUndefined();
    expect(loadedComp.numberProp).toBeUndefined();
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[1].outputSubscriptions.componentClicked).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions.eventTriggered).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions.httpResponseReceived).toBeDefined();

    // c) Test inputBlacklist + inputWhitelist
    ({fixture, comp} = prepareTestingModule([{component: SingleTagTestComponent, enclosing: false, inputsBlacklist: ['simpleArray'], inputsWhitelist: ['simpleArray', 'numberProp']}]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;

    expect(loadedComp.stringProp).toBeUndefined();
    expect(loadedComp.numberProp).toBe(917);
    expect(loadedComp.simpleArray).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions.componentClicked).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions.eventTriggered).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions.httpResponseReceived).toBeDefined();

    // d) Test outputBlacklist
    ({fixture, comp} = prepareTestingModule([{component: SingleTagTestComponent, enclosing: false, outputsBlacklist: ['eventTriggeredAlias']}]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;

    expect(loadedComp.stringProp).toBe('this is an example string');
    expect(loadedComp.numberProp).toBe(917);
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[1].outputSubscriptions.componentClicked).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions.eventTriggered).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions.httpResponseReceived).toBeDefined();

    // e) Test outputWhitelist
    ({fixture, comp} = prepareTestingModule([{component: SingleTagTestComponent, enclosing: false, outputsWhitelist: ['httpResponseReceived']}]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;

    expect(loadedComp.stringProp).toBe('this is an example string');
    expect(loadedComp.numberProp).toBe(917);
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[1].outputSubscriptions.componentClicked).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions.eventTriggered).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions.httpResponseReceived).toBeDefined();

    // f) Test outputBlacklist + outputWhitelist
    ({fixture, comp} = prepareTestingModule([{component: SingleTagTestComponent, enclosing: false, outputsBlacklist: ['httpResponseReceived'], outputsWhitelist: ['eventTriggeredAlias', 'httpResponseReceived']}]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;

    expect(loadedComp.stringProp).toBe('this is an example string');
    expect(loadedComp.numberProp).toBe(917);
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[1].outputSubscriptions.componentClicked).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions.eventTriggered).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions.httpResponseReceived).toBeUndefined();
  });

  it('#should disallow context access, if requested', () => {
    const testText = `<dynhooks-singletagtest [numberProp]="context.order" (httpResponseReceived)="context.maneuvers.meditate()">`;

    // Context access allowed
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      enclosing: false,
      allowContextInBindings: true
    }]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    let loadedComp = comp.hookIndex[1].componentRef.instance;
    spyOn(context.maneuvers, 'meditate').and.callThrough();

    expect(loadedComp.numberProp).toBe(66);
    loadedComp.httpResponseReceived.emit(200);
    expect(context.maneuvers.meditate['calls'].count()).toBe(1);

    // Context access not allowed
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      enclosing: false,
      allowContextInBindings: false
    }]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;

    expect(loadedComp.numberProp).toBe(undefined);
    loadedComp.httpResponseReceived.emit(300);
    expect(context.maneuvers.meditate['calls'].count()).toBe(1); // Should not have increased from before
  });

  it('#should disallow context function calls, if requested', () => {
    const testText = `<dynhooks-singletagtest [stringPropAlias]="context.maneuvers.defend('the innocent')" (httpResponseReceived)="context.maneuvers.meditate()">`;

    // Context access allowed
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      enclosing: false,
      allowContextFunctionCalls: true
    }]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    let loadedComp = comp.hookIndex[1].componentRef.instance;
    spyOn(context.maneuvers, 'meditate').and.callThrough();

    expect(loadedComp.stringProp).toBe('defending the innocent!');
    loadedComp.httpResponseReceived.emit(200);
    expect(context.maneuvers.meditate['calls'].count()).toBe(1);

    // Context access not allowed
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      enclosing: false,
      allowContextFunctionCalls: false
    }]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    loadedComp = comp.hookIndex[1].componentRef.instance;

    expect(loadedComp.stringProp).toBe(undefined);
    loadedComp.httpResponseReceived.emit(200);
    expect(context.maneuvers.meditate['calls'].count()).toBe(1); // Should not have increased from before
  });

  // 8. OutletService standalone usage
  // --------------------------------------------------------------------------

  it('#should create and fill a new HTML-Element by using the OutletService directly', () => {
    const outletService: any = TestBed.inject(OutletService);

    const testText = `
      <p>This p-element has a <span>span-element with a component <dynHooks-singletagtest [stringPropAlias]="'/media/maps/valley_of_the_four_winds.png'" [simpleArray]='["chen stormstout", "nomi"]'></span> within it.</p>
      <p>Here's another one: <dynHooks-multiTagTest [fonts]="['arial', 'calibri']"></dynHooks-multiTagTest></p>
    `;

    outletService.parse(testText).subscribe((outletParseResult: OutletParseResult) => {
      expect(Object.values(outletParseResult.hookIndex).length).toBe(2);

      expect(outletParseResult.element.querySelector('.singletag-component')).not.toBe(null);
      expect(outletParseResult.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
      expect(outletParseResult.hookIndex[1].componentRef.instance.stringProp).toBe('/media/maps/valley_of_the_four_winds.png');
      expect(outletParseResult.hookIndex[1].componentRef.instance.simpleArray).toEqual(["chen stormstout", "nomi"]);

      expect(outletParseResult.element.querySelector('.multitag-component')).not.toBe(null);
      expect(outletParseResult.hookIndex[2].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
      expect(outletParseResult.hookIndex[2].componentRef.instance.fonts).toEqual(['arial', 'calibri']);
    });
  });

  it('#should fill an existing HTML-Element by using the OutletService directly', () => {
    const outletService: any = TestBed.inject(OutletService);

    const testText = `
      <p>This p-element has a <span>span-element with a component <dynHooks-singletagtest [stringPropAlias]="'/media/maps/valley_of_the_four_winds.png'" [simpleArray]='["chen stormstout", "nomi"]'></span> within it.</p>
      <p>Here's another one: <dynHooks-multiTagTest [fonts]="['arial', 'calibri']"></dynHooks-multiTagTest></p>
    `;

    const existingElement = document.createElement('article');
    existingElement.setAttribute('id', 'myExistingElement');

    outletService.parse(testText, {}, null, null, null, null, existingElement, null).subscribe((outletParseResult: OutletParseResult) => {
      expect(Object.values(outletParseResult.hookIndex).length).toBe(2);

      expect(existingElement.getAttribute('id')).toBe('myExistingElement');
      expect(existingElement.tagName).toBe('ARTICLE');
      expect(existingElement).toBe(outletParseResult.element);

      expect(existingElement.querySelector('.singletag-component')).not.toBe(null);
      expect(outletParseResult.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
      expect(outletParseResult.hookIndex[1].componentRef.instance.stringProp).toBe('/media/maps/valley_of_the_four_winds.png');
      expect(outletParseResult.hookIndex[1].componentRef.instance.simpleArray).toEqual(["chen stormstout", "nomi"]);

      expect(existingElement.querySelector('.multitag-component')).not.toBe(null);
      expect(outletParseResult.hookIndex[2].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
      expect(outletParseResult.hookIndex[2].componentRef.instance.fonts).toEqual(['arial', 'calibri']);
    });
  });

});
