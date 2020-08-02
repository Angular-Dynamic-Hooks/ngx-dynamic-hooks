import { ElementRef, Injector } from '@angular/core';
import { TestBed, ComponentFixtureAutoDetect } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { first } from 'rxjs/operators';

import { GenericSelectorParser } from '../lib/parsers/genericSelector/GenericSelectorParser';
import { OutletComponent } from '../lib/components/dynamicHooks/outletComponent.c';
import { OutletOptions, outletOptionDefaults } from '../lib/components/dynamicHooks/options/options';
import { DYNAMICCONTENTCOMPONENTS_GLOBALSETTINGS, DynamicContentComponentsGlobalSettings } from '../lib/globalSettings';

import { SingleTagTestComponent } from './components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from './components/multiTagTest/multiTagTest.c';
import { InlineTestComponent } from './components/inlineTest/inlineTest.c';
import { NgContentTestParser } from './parsers/ngContentTestParser';
import { ServiceTestParser } from './parsers/serviceTestParser';
import { NonServiceTestParser } from './parsers/nonServiceTestParser';
import { TESTSERVICETOKEN, TestService } from './services/testService';
import { ComponentCreator } from '../lib/components/dynamicHooks/services/componentCreator';
import { ComponentUpdater } from '../lib/components/dynamicHooks/services/componentUpdater';
import { HooksReplacer } from '../lib/components/dynamicHooks/services/hooksReplacer';
import { BindingStateManager } from '../lib/parsers/genericSelector/services/bindingStateManager';
import { GenericSelectorFinder } from '../lib/parsers/genericSelector/services/genericSelectorFinder';
import { DataTypeEncoder } from '../lib/utils/dataTypeEncoder';
import { DataTypeParser } from '../lib/utils/dataTypeParser';
import { DeepComparer } from '../lib/utils/deepComparer';
import { HookFinder } from '../lib/utils/hookFinder';
import { HookParserEntry } from '../lib/components/dynamicHooks/options/parserEntry';

/**
 * Feature-oriented tests for the whole module
 */

export class MockElementRef {
  nativeElement: {};
}

// The standard parsers to be used for most tests
const testParsers: Array<HookParserEntry> = [
  {
    component: SingleTagTestComponent,
    multiTag: false
  },
  {component: MultiTagTestComponent},
  {component: InlineTestComponent}
];

// A simple function to reset and prepare the testing module
function prepareTestingModule(parsers?, options?) {
  // Generate settings
  const globalSettings: DynamicContentComponentsGlobalSettings = {};
  if (parsers) { globalSettings.globalParsers = parsers; }
  if (options) { globalSettings.globalOptions = options; }

  // Generate declarations
  let declarations = [OutletComponent];
  if (parsers) { declarations = declarations.concat(...parsers.filter(entry => typeof entry.component === 'function').map(entry => entry.component)); }

  // Get all services
  const services = [
    // Main component services
    ComponentCreator,
    ComponentUpdater,
    HooksReplacer,
    // Parser services
    BindingStateManager,
    GenericSelectorFinder,
    // Util services
    DataTypeEncoder,
    DataTypeParser,
    DeepComparer,
    HookFinder,
    // Test services
    TestService,
    // Other
    ServiceTestParser,
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
      provide: DYNAMICCONTENTCOMPONENTS_GLOBALSETTINGS,
      useValue: globalSettings
    });
  }

  // Generate entryComponents
  let entryComponents = [];
  if (parsers) { entryComponents = entryComponents.concat(...parsers.filter(entry => typeof entry.component === 'function').map(entry => entry.component)); }

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
    fixture: fixture,
    comp: fixture.componentInstance
  };
}

describe('DynamicHooksComponent', () => {
  let fixture;
  let comp: OutletComponent;
  let context: {[key: string]: any};

  // Set up
  // ###############################################################################################################################################

  beforeEach(() => {
    ({fixture, comp} = prepareTestingModule(testParsers));

    context = {
      parent: comp,
      greeting: 'Hello there!',
      order: 66,
      maneuvers: {
        modifyParent: (event) => comp['completelyNewProperty'] = event,
        getMentalState: () => 'angry',
        findAppropriateAction: (mentalState) => mentalState === 'angry' ? 'meditate' : 'protectDemocracy',
        meditate: () => { return {action:'meditating!', state: 'calm'}; },
        protectDemocracy: () => { return {action: 'hunting sith!', state: 'vigilant'}; },
        attack: (enemy) => 'attacking ' + enemy + '!',
        generateEnemy: (name) => { return {name: 'the evil ' + name, type: 'monster'}; },
        defend: (person) => 'defending ' + person + '!',
        readJediCode: () => 'dont fall in love with pricesses from naboo',
        goIntoExile: () => 'into exile, i must go!',
        combo: (param1, param2) => 'Combo: ' + param1 + ' and ' + param2
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

  // 1. DynamicHookComponent basics
  // --------------------------------------------------------------------------

  it('#should have created the main component correctly', () => {
    expect(comp).toBeDefined();
  });

  it('#should load the global settings correctly', () => {
    const testText = `<p>This p-element has a <span>span-element with a component <dynHooks-singletagtest></span> within it.</p>`;

    // Test with config for SingleTagTestComponent
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      multiTag: false
    }]));
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(GenericSelectorParser));
    expect(comp.activeParsers[0]['config'].component.prototype.constructor.name).toBe('SingleTagTestComponent');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');

    // Test with config for MultiTagTestComponent
    ({fixture, comp} = prepareTestingModule([{
      component: MultiTagTestComponent
    }]));
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(GenericSelectorParser));
    expect(comp.activeParsers[0]['config'].component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect(Object.keys(comp.hookIndex).length).toBe(0);
  });

  it('#should not crash if the user does not declare global settings', () => {
    const testText = `<p>This is just a bit of text.</p>`;

    ({fixture, comp} = prepareTestingModule());
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(comp['globalSettings']).toBeNull();
    expect(fixture.nativeElement.innerHTML).toBe(testText);

    // Options should be default
    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toBe(outletOptionDefaults[key]);
    }

    // Parsers should be empty
    expect(comp.activeParsers.length).toBe(0);
  });

  it('#should load global parsers correctly', () => {
    comp.content = 'something';
    comp.ngOnChanges({content: true});

    expect(comp.activeParsers.length).toBe(3);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(GenericSelectorParser));
    expect(comp.activeParsers[1]).toEqual(jasmine.any(GenericSelectorParser));
    expect(comp.activeParsers[2]).toEqual(jasmine.any(GenericSelectorParser));
    expect(comp.activeParsers[0]['config'].component.prototype.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.activeParsers[1]['config'].component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.activeParsers[2]['config'].component.prototype.constructor.name).toBe('InlineTestComponent');
  });

  it('#should load local parsers correctly', () => {
    comp.content = 'something';
    comp.parsers = [{
      component: InlineTestComponent,
      parseInputs: false
    }];
    comp.ngOnChanges({content: true, parsers: true});

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(GenericSelectorParser));
    expect(comp.activeParsers[0]['config'].component.prototype.constructor.name).toBe('InlineTestComponent');
    expect(comp.activeParsers[0]['config'].parseInputs).toBe(false);
  });

  it('#should be able to load parsers in their various forms', () => {
    // Should be able to load parsers that are object literals
    comp.content = 'This is a sentence with a <dynhooks-singletagtest>.';
    comp.parsers = [{component: SingleTagTestComponent, multiTag: false}];
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('GenericSelectorParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.childNodes[0].textContent).toBe('This is a sentence with a ');
    expect(fixture.nativeElement.childNodes[1].tagName).toBe('DYNHOOKS-SINGLETAGTEST');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should be able to load parsers that are services
    comp.content = 'This is a sentence with a <dynhooks-serviceparsercomponent>.';
    comp.parsers = [ServiceTestParser];
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('ServiceTestParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.childNodes[0].textContent).toBe('This is a sentence with a ');
    expect(fixture.nativeElement.childNodes[1].tagName).toBe('DYNHOOKS-SINGLETAGTEST');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should be able to load parsers that are classes
    comp.content = 'This is a sentence with a customhook.';
    comp.parsers = [NonServiceTestParser];
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('NonServiceTestParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.childNodes[0].textContent).toBe('This is a sentence with a ');
    expect(fixture.nativeElement.childNodes[1].tagName).toBe('DYNHOOKS-SINGLETAGTEST');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should be able to load parsers that are instances
    comp.content = 'This is a sentence with a customhook.';
    comp.parsers = [new NonServiceTestParser()];
    comp.ngOnChanges({content: true, parsers: true});
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('NonServiceTestParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.childNodes[0].textContent).toBe('This is a sentence with a ');
    expect(fixture.nativeElement.childNodes[1].tagName).toBe('DYNHOOKS-SINGLETAGTEST');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();
  });

  it('#should load fine without parsers', () => {
    ({fixture, comp} = prepareTestingModule([]));

    comp.content = 'something';
    comp.ngOnChanges({content: true});

    expect(comp.activeParsers.length).toBe(0);
    expect(fixture.nativeElement.innerHTML).toBe('something');
  });

  it('#should load global options correctly', () => {
    const differentOptions = {};
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
    const differentOptions = {};
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

  it('#should load fine without options', () => {
    ({fixture, comp} = prepareTestingModule(testParsers, []));

    comp.content = 'something';
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.innerHTML).toBe('something');
    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toBe(outletOptionDefaults[key]);
    }
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
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.parse['calls'].count()).toBe(1);

    // Change 'text'
    const testTextTwo = `<span>Some other text <dynHooks-singletagtest><dynHooks-multitagtest></dynHooks-multitagtest></span>`;
    comp.content = testTextTwo;
    comp.ngOnChanges({content: true});
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(Object.values(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.parse['calls'].count()).toBe(2);

    // Change 'options'
    const newOptions = {sanitize: false};
    comp.options = newOptions;
    comp.ngOnChanges({options: true});
    expect(comp.parse['calls'].count()).toBe(3);

    // Change 'globalParsersBlacklist'
    const blacklist = ['SingleTagTestComponentParser'];
    comp.globalParsersBlacklist = blacklist;
    comp.ngOnChanges({globalParsersBlacklist: true});
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.parse['calls'].count()).toBe(4);

    // Reset
    comp.globalParsersBlacklist = null;
    comp.globalParsersWhitelist = null;
    comp.ngOnChanges({globalParsersBlacklist: true, globalParsersWhitelist: true});
    expect(Object.values(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.parse['calls'].count()).toBe(5);

    // Change 'globalParsersWhitelist'
    const whitelist = ['SingleTagTestComponentParser'];
    comp.globalParsersWhitelist = whitelist;
    comp.ngOnChanges({globalParsersWhitelist: true});
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.parse['calls'].count()).toBe(6);

    // Change 'parsers' (while leaving 'globalParsersWhitelist' as is, should be ignored)
    comp.parsers = [{component: MultiTagTestComponent, name: 'LocalParser!'}];
    comp.ngOnChanges({parsers: true});
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(GenericSelectorParser));
    expect(comp.activeParsers[0]['config'].component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.activeParsers[0]['name']).toBe('LocalParser!');
    expect(comp.parse['calls'].count()).toBe(7);
  });

  // 2. Loading dynamic components
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

    expect(fixture.nativeElement.innerHTML).toBe(testText);
    expect(Object.values(comp.hookIndex).length).toBe(0);
  });

  it('#should load a single tag dynamic component', () => {
    const testText = `<p>This p-element has a <span>span-element with a component <dynHooks-singletagtest [stringAlias]="'/media/maps/valley_of_the_four_winds.png'" [simpleArray]='["chen stormstout", "nomi"]'></span> within it.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null); // Component has loaded
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
  });

  it('#should load a multi tag dynamic component', () => {
    const testText = `<p>This is a multi tag component <dynHooks-multitagtest>This is the inner content.</dynHooks-multitagtest>.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null); // Component has loaded
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML).toBe('This is the inner content.'); // Transcluded content works
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
  });

  it('#should load nested components', () => {
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

    const grandParentComponentEl = fixture.nativeElement.childNodes[1].childNodes[1];
    expect(grandParentComponentEl.childNodes[0].className).toBe('multitag-component');

    const parentComponentOneEl = grandParentComponentEl.childNodes[0].childNodes[1];
    const parentComponentTwoEl = grandParentComponentEl.childNodes[0].childNodes[3];
    expect(parentComponentOneEl.childNodes[0].className).toBe('multitag-component');
    expect(parentComponentTwoEl.childNodes[0].className).toBe('multitag-component');
    expect(comp.hookIndex[6].componentRef.instance.nr).toBe(867);

    const childComponentOneEl = parentComponentOneEl.childNodes[0].childNodes[1];
    const childComponentTwoEl = parentComponentOneEl.childNodes[0].childNodes[3];
    expect(childComponentOneEl.childNodes[0].className).toBe('singletag-component');
    expect(childComponentTwoEl.childNodes[0].className).toBe('multitag-component');
    expect(comp.hookIndex[2].componentRef.instance.stringProp).toBe('this is the first singletagtest');
    expect(comp.hookIndex[2].componentRef.instance.simpleArray).toEqual(["testString1", "testString2"]);

    const grandcChildComponentOneEl = childComponentTwoEl.childNodes[0].childNodes[1];
    const spanInBetween = childComponentTwoEl.childNodes[0].childNodes[3];
    const grandcChildComponentTwoEl = childComponentTwoEl.childNodes[0].childNodes[5];
    expect(grandcChildComponentOneEl.childNodes[0].className).toBe('inline-component');
    expect(spanInBetween.textContent).toBe('And an element in between');
    expect(grandcChildComponentTwoEl.childNodes[0].className).toBe('singletag-component');
    expect(comp.hookIndex[4].componentRef.instance.config).toEqual({prop: true});

    expect(Object.values(comp.hookIndex).length).toBe(7);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[3].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[4].componentRef.instance.constructor.name).toBe('InlineTestComponent');
    expect(comp.hookIndex[5].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[6].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
  });

  it('#should not load incorrectly nested components', () => {
    const testText = `<p>Overlapping textboxes: <dynhooks-multitagtest id="'overlapping'">text from multitag<dynhooks-inlinetest id="'overlapping-inner'">text from inline</dynhooks-multitagtest></dynhooks-inlinetest></p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.inline-component')).toBe(null);
  });

  it('#should load components at their correct positions', () => {
    const testText = `
    <ul>
      <li>This is the first li-element.</li>
      <li>This is the <dynhooks-inlinetest>second</dynhooks-inlinetest> li-element. It has a component <dynhooks-singletagtest [stringAlias]="'/media/maps/azsuna.png'" [simpleArray]='["Farondis"]'> in it. Lets put another component <dynhooks-singletagtest [stringAlias]="'/media/maps/suramar.png'" [simpleArray]='["Elisande", "Thalyssra"]'> here.</li>
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

    const ul = fixture.nativeElement.childNodes[1];
    const firstLi = ul.childNodes[1];
    expect(firstLi.innerText).toBe('This is the first li-element.');

    const secondLi = ul.childNodes[3];
    expect(secondLi.childNodes[0].textContent).toBe('This is the ');
    expect(secondLi.childNodes[1].childNodes[0].className).toBe('inline-component');
    expect(secondLi.childNodes[1].childNodes[0].innerText).toBe('second');
    expect(secondLi.childNodes[2].textContent).toBe(' li-element. It has a component ');
    expect(secondLi.childNodes[3].childNodes[0].className).toBe('singletag-component');
    expect(secondLi.childNodes[4].textContent).toBe(' in it. Lets put another component ');
    expect(secondLi.childNodes[5].childNodes[0].className).toBe('singletag-component');
    expect(secondLi.childNodes[6].textContent).toBe(' here.');

    const thirdLi = ul.childNodes[5];
    expect(thirdLi.childNodes[0].textContent).toBe('This is the third li-element. It has a ');
    expect(thirdLi.childNodes[1].tagName).toBe('A');
    expect(thirdLi.childNodes[1].textContent).toBe('link');
    expect(thirdLi.childNodes[2].textContent).toBe('.');

    const fourthLi = ul.childNodes[7];
    expect(fourthLi.childNodes[1].tagName).toBe('SPAN');
    expect(fourthLi.childNodes[1].textContent).toBe('And this is the last');
    expect(fourthLi.childNodes[3].childNodes[0].className).toBe('multitag-component');
    expect(fourthLi.childNodes[3].childNodes[0].childNodes[1].tagName).toBe('SPAN');
    expect(fourthLi.childNodes[3].childNodes[0].childNodes[1].textContent).toBe('element in this test');
    expect(fourthLi.childNodes[5].tagName).toBe('SPAN');
    expect(fourthLi.childNodes[5].textContent).toBe('that we are looking at.');
  });

  it('#should lazy-load components', (done) => {
    const testText = `<p>
      A couple of components:
      <dynhooks-singletagtest [stringProp]="'something'">
      <dynhooks-multitagtest [nr]="4">
        <dynhooks-lazytest [name]="'sleepy'"></dynhooks-lazytest>
      </dynHooks-multitagtest>
      <dynhooks-inlinetest [nr]="87"></dynhooks-inlinetest>
    </p>`;

    const parsersWithLazyParser = testParsers.concat([{
      component: {
        importPromise: () => import('./components/lazyTest/lazyTest.c'),
        importName: 'LazyTestComponent'
      },
      selector: 'dynhooks-lazytest'
    }]);

    comp.content = testText;
    comp.parsers = parsersWithLazyParser;
    comp.context = context;
    let componentsLoadedHasEmitted = false;
    comp.componentsLoaded.pipe(first()).subscribe(() => componentsLoadedHasEmitted = true);
    comp.ngOnChanges({content: true, context: true});

    // Everything except the lazy-loaded component should be loaded
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.inline-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.lazy-component')).toBe(null);
    expect(fixture.nativeElement.querySelector('dynamic-component-placeholder')).not.toBe(null);

    expect(Object.values(comp.hookIndex).length).toBe(4);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef).toBeNull();
    expect(comp.hookIndex[3].componentRef.instance.constructor.name).toBe('InlineTestComponent');

    // Make sure that onDynamicChanges has triggered on component init
    spyOn(comp.hookIndex[1].componentRef.instance, 'onDynamicChanges').and.callThrough();
    expect(comp.hookIndex[1].componentRef.instance.onDynamicChanges['calls'].count()).toBe(0);
    expect(comp.hookIndex[1].componentRef.instance.changesContext).toEqual(context);
    expect(comp.hookIndex[1].componentRef.instance.changesContentChildren).toBeUndefined();

    // Make sure that onDynamicMount has not yet triggered
    spyOn(comp.hookIndex[1].componentRef.instance, 'onDynamicMount').and.callThrough();
    expect(comp.hookIndex[1].componentRef.instance.onDynamicMount['calls'].count()).toBe(0);
    expect(comp.hookIndex[1].componentRef.instance.mountContext).toBeUndefined();
    expect(comp.hookIndex[1].componentRef.instance.mountContentChildren).toBeUndefined();

    // Also, componentsLoaded should not yet have triggered
    expect(componentsLoadedHasEmitted).toBeFalse();

    // Have to manually wait. Neither tick() nor fixture.whenStable() seems to wait for dynamic imports
    setTimeout(() => {
      // Lazy-loaded component should be loaded by now
      expect(fixture.nativeElement.querySelector('.lazy-component')).not.toBe(null);
      expect(fixture.nativeElement.querySelector('dynamic-component-placeholder')).toBe(null);
      expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('LazyTestComponent');
      expect(comp.hookIndex[2].componentRef.instance.name).toBe('sleepy');

      // Make sure that onDynamicChanges has triggered again (with contentChildren)
      expect(comp.hookIndex[1].componentRef.instance.onDynamicChanges['calls'].count()).toBe(1);
      expect(comp.hookIndex[1].componentRef.instance.changesContext).toEqual(context);
      expect(comp.hookIndex[1].componentRef.instance.changesContentChildren.length).toBe(1);
      expect(comp.hookIndex[1].componentRef.instance.changesContentChildren[0].name).toBe('LazyTestComponent');

      // Make sure that onDynamicMount has triggered
      expect(comp.hookIndex[1].componentRef.instance.onDynamicMount['calls'].count()).toBe(1);
      expect(comp.hookIndex[1].componentRef.instance.mountContext).toEqual(context);
      expect(comp.hookIndex[1].componentRef.instance.mountContentChildren.length).toBe(1);
      expect(comp.hookIndex[1].componentRef.instance.mountContentChildren[0].name).toBe('LazyTestComponent');

      // ComponentsLoaded should have emitted now
      expect(componentsLoadedHasEmitted).toBeTrue();

      done();
    }, 100);
  });

  it('#should parse inputs properly', () => {
    const testText = `
    <dynhooks-multitagtest [fonts]="['test', 'something', 'here']"></dynhooks-multitagtest>
    <dynhooks-singletagtest
      id="someid"
      [nonInputProperty]="'this should not be set as input'"
      [stringPropAlias]="'this is just a test string'"
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
    const firstComp: MultiTagTestComponent = comp.hookIndex[0].componentRef.instance;
    const secondComp: SingleTagTestComponent = comp.hookIndex[1].componentRef.instance;
    const thirdComp: InlineTestComponent = comp.hookIndex[2].componentRef.instance;

    // Make sure components are loaded properly
    expect(Object.keys(comp.hookIndex).length).toBe(3);
    expect(firstComp.constructor.name).toBe('MultiTagTestComponent');
    expect(secondComp.constructor.name).toBe('SingleTagTestComponent');
    expect(thirdComp.constructor.name).toBe('InlineTestComponent');
    expect(fixture.nativeElement.childNodes[5].textContent).toBe('This should be untouched');

    // Check all inputs
    expect(firstComp.fonts).toEqual(['test', 'something', 'here']);

    expect(secondComp['id']).toBe(undefined);
    expect(secondComp.nonInputProperty).toBe('this is the default value');
    expect(secondComp.stringProp).toBe('this is just a test string');
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

  it('#should parse outputs properly', () => {
    const testText = `<dynhooks-singletagtest [numberProp]="123" (componentClickedAlias)="context.maneuvers.modifyParent($event)">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});

    expect(comp['completelyNewProperty']).toBeUndefined();
    comp.hookIndex[0].componentRef.instance.componentClicked.emit(555);
    expect(comp['completelyNewProperty']).toBe(555);
  });

  it('#should replace (currently) invalid context vars with undefined, but fix them when they become available', () => {
    const testText = `<dynhooks-singletagtest [simpleObject]='{validContextVar: context._jediCouncil.kenobi, invalidContextVar: context.sithTriumvirate.kreia}'>`;
    comp.content = testText;
    comp.context = context;
    comp.options = {changeDetectionStrategy: 'default'};
    comp.ngOnChanges({content: true, context: true, options: true});

    // One of them should be undefined
    const loadedComp = comp.hookIndex[0].componentRef.instance;
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

  it('#should load custom ng-content properly', () => {
    const testText = `<dynhooks-ngcontenttest><p>original content</p></dynhooks-ngcontenttest>`;
    const parsersWithNgContentParser = testParsers.concat([NgContentTestParser]);
    comp.content = testText;
    comp.parsers = parsersWithNgContentParser;
    comp.ngOnChanges({content: true, context: true});

    const componentElement = fixture.nativeElement.childNodes[0];
    const firstContentContainer = componentElement.childNodes[0].childNodes[0].childNodes[1];
    const secondContentContainer = componentElement.childNodes[0].childNodes[1].childNodes[1];
    const thirdContentContainer = componentElement.childNodes[0].childNodes[2].childNodes[1];

    // Test custom ng-content
    // NgContentTestParser always returns unique hardcoded ngContent for NgContentTestComponent
    // instead of the actual childNodes. Check that this hardcoded content is correctly rendered.
    expect(firstContentContainer.innerHTML).toBe('<span>this should be highlighted</span>');                    // Should replace normal child nodes
    expect(secondContentContainer.innerHTML).toBe('');                                                          // Intentionally skipped this ngContent-index
    expect(thirdContentContainer.innerHTML).toBe('<h2>This is the title</h2><div>Some random content</div>');   // Should have two elements
  });

  it('#should correctly trigger onDynamicMount() on init', () => {
    const testText = `
    <dynhooks-multitagtest id="outercomp">
      bla bla
      <dynhooks-singletagtest>
      <p>some<b>text</b></p>
      <div>
        <dynhooks-multitagtest id="innercomp">
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
    comp.ngOnChanges({content: true, context: true});

    const outerComp = comp.hookIndex[0].componentRef.instance;
    const innerFirstComp = comp.hookIndex[1].componentRef.instance;
    const innerSecondComp = comp.hookIndex[2].componentRef.instance;
    const deepInnerComp = comp.hookIndex[3].componentRef.instance;

    // Context should have been passed in
    expect(outerComp.mountContext).toEqual(context);
    expect(innerFirstComp.mountContext).toEqual(context);
    expect(innerSecondComp.mountContext).toEqual(context);
    expect(deepInnerComp.mountContext).toEqual(context);

    // Content children should have been passed in
    expect(outerComp.mountContentChildren.length).toBe(2);
    expect(outerComp.mountContentChildren[0].name).toBe('SingleTagTestComponent');
    expect(outerComp.mountContentChildren[0].contentChildren.length).toBe(0);
    expect(outerComp.mountContentChildren[1].name).toBe('MultiTagTestComponent');
    expect(outerComp.mountContentChildren[1].contentChildren.length).toBe(1);
    expect(outerComp.mountContentChildren[1].contentChildren[0].name).toBe('InlineTestComponent');
    expect(innerFirstComp.mountContentChildren.length).toBe(0);
    expect(innerSecondComp.mountContentChildren.length).toBe(1);
    expect(innerSecondComp.mountContentChildren[0].name).toBe('InlineTestComponent');
    expect(deepInnerComp.mountContentChildren.length).toBe(0);
  });

  it('#should correctly trigger onDynamicChanges() on context reference change', () => {
    const testText = `<dynhooks-singletagtest>`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    const loadedComp = comp.hookIndex[0].componentRef.instance;
    spyOn(loadedComp, 'onDynamicChanges').and.callThrough();
    spyOn(comp['componentUpdater'], 'refresh').and.callThrough();

    expect(loadedComp.changesContext).toEqual(context);

    // Shouldn't be called when only context property changes...
    comp.context.order = 77;
    comp.ngDoCheck();
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(1);
    expect(loadedComp.onDynamicChanges['calls'].count()).toBe(0);

    // ...only when context changes by reference
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

    // No change detection yet
    expect(fixture.nativeElement.querySelector('.singletag-nr')).toBeNull();

    // Trigger
    fixture.detectChanges();

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
    const firstComp = comp.hookIndex[0].componentRef.instance;
    const secondComp = comp.hookIndex[1].componentRef.instance;

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

  // 3. DynamicHookComponent options
  // --------------------------------------------------------------------------

  it('#should apply the parserBlacklist and parserWhitelist, if requested', () => {
    const testText = `
      <p><dynhooks-singletagtest></p>
      <p><dynhooks-multitagtest></dynhooks-multitagtest></p>
      <p><dynhooks-inlinetest></dynhooks-inlinetest></p>
    `;
    comp.content = testText;
    comp.globalParsersBlacklist = null;
    comp.globalParsersWhitelist = null;
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true});

    // Expect that no component is filtered
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.inline-component')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(3);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('InlineTestComponent');

    // Blacklist: Expect that MultiTagComponentParser is not loaded
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.globalParsersBlacklist = ['MultiTagTestComponentParser'];
    comp.globalParsersWhitelist = null;
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true});

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.inline-component')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('InlineTestComponent');

    // WhiteList: Expect that only InlineTestComponentParser is loaded
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.globalParsersBlacklist = null;
    comp.globalParsersWhitelist = ['InlineTestComponentParser'];
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true});

    expect(fixture.nativeElement.querySelector('.singletag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.inline-component')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('InlineTestComponent');

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
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
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
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[0].componentRef.instance.simpleObject).toEqual({testProp: 123, otherProp: true});

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
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[0].componentRef.instance.simpleObject).toEqual({testProp: 123, otherProp: true});
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
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[0].componentRef.instance.numberProp).toBe(21);
    expect(comp.hookIndex[0].componentRef.instance.simpleArray).toEqual(['enrico', 'susanne']);

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { convertHTMLEntities: false, sanitize: false };
    comp.ngOnChanges({content: true, options: true});

    // Ensure that HTML-Entities are not replaced
    expect(fixture.nativeElement.innerHTML).toContain('&lt;b&gt;BOLD&lt;/b&gt;');
    expect(Object.keys(comp.hookIndex).length).toBe(0);
  });

  it('#should fixParagraphArtifacts, if requested', () => {
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
    comp.options = { fixParagraphArtifacts: true };
    comp.ngOnChanges({content: true, options: true});

    // Ensure that p-artifacts are removed
    expect(fixture.nativeElement.childNodes.length).toBe(5);
    expect(fixture.nativeElement.childNodes[1].tagName).toBe('P');
    expect(fixture.nativeElement.childNodes[1].textContent).toBe('Textbox in seperate HTML-tags, with contained HTML:');
    expect(fixture.nativeElement.childNodes[3].tagName).toBe('DYNHOOKS-MULTITAGTEST');
    expect(fixture.nativeElement.childNodes[3].childNodes.length).toBe(1);
    expect(fixture.nativeElement.childNodes[3].childNodes[0].className).toBe('multitag-component');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { fixParagraphArtifacts: false };
    comp.ngOnChanges({content: true, options: true});

    // Ensure that p-artifacts are not replaced
    // Any number of things can be wrong when letting the browser parse invalid HTML
    // Not trying to make this check too specific.
    expect(fixture.nativeElement.childNodes.length).not.toBe(5);
  });

  it('#should update on push only, if requested', () => {
    const testText = `<dynhooks-singletagtest>`;
    comp.content = testText;
    comp.context = context;
    comp.options = {changeDetectionStrategy: 'onPush'};
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
    comp.options = {changeDetectionStrategy: 'default'};
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
    // the GenericSelectorParser to reparse the whole binding, thus changing the reference.
    const newContext = {$lightSaberCollection: [...context.$lightSaberCollection]};
    const testText = `<dynhooks-singletagtest [simpleObject]="{lightsabers: context.$lightSaberCollection}">`;

    comp.content = testText;
    comp.context = context;
    comp.options = { compareInputsByValue: true };
    comp.ngOnChanges({content: true, context: true, options: true});
    let loadedComp = comp.hookIndex[0].componentRef.instance;
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
    loadedComp = comp.hookIndex[0].componentRef.instance;
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

  it('#should apply the desired compareByValueDepth', () => {
    const firstContext = {someObj: {firstLevel: {secondLevel: {thirdLevel: {someValue: 5 }}}}};
    const secondContext = {someObj: {firstLevel: {secondLevel: {thirdLevel: {someValue: 10 }}}}};

    const testText = `<dynhooks-singletagtest [simpleObject]="context.someObj">`;
    comp.content = testText;
    comp.context = firstContext;
    comp.options = { compareInputsByValue: true, compareByValueDepth: 3 };
    comp.ngOnChanges({content: true, context: true, options: true});
    let loadedComp = comp.hookIndex[0].componentRef.instance;
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
    loadedComp = comp.hookIndex[0].componentRef.instance;
    spyOn<any>(loadedComp, 'ngOnChanges').and.callThrough();

    // Expect ngOnChanges to trigger if changed value is within of reach
    comp.context = secondContext;
    comp.ngOnChanges({context: true});
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(1);
  });

  it('#should ignoreInputAliases, if requested', () => {
    const testText = `<dynhooks-singletagtest [stringPropAlias]="'Hello there'" [stringProp]="'General Kenobi'">`;
    comp.content = testText;
    comp.options = { ignoreInputAliases: true };
    comp.ngOnChanges({content: true, options: true});
    let loadedComp = comp.hookIndex[0].componentRef.instance;

    // Expect input property to be set by its property name
    expect(loadedComp.stringProp).toBe('General Kenobi');

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { ignoreInputAliases: false };
    comp.ngOnChanges({content: true, options: true});
    loadedComp = comp.hookIndex[0].componentRef.instance;

    // Expect input property to be set by its alias
    expect(loadedComp.stringProp).toBe('Hello there');
  });

  it('#should ignoreOutputAliases, if requested', () => {
    const testText = `<dynhooks-singletagtest (eventTriggeredAlias)="123" (componentClicked)="456">`;
    comp.content = testText;
    comp.options = { ignoreOutputAliases: true };
    comp.ngOnChanges({content: true, options: true});
    let loadedComp = comp.hookIndex[0].componentRef.instance;

    // Expect output property to be set by its property name
    expect(comp.hookIndex[0].outputSubscriptions['componentClicked']).toBeDefined();
    expect(comp.hookIndex[0].outputSubscriptions['eventTriggered']).toBeUndefined();

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { ignoreOutputAliases: false };
    comp.ngOnChanges({content: true, options: true});
    loadedComp = comp.hookIndex[0].componentRef.instance;

    // Expect output property to be set by its alias
    expect(comp.hookIndex[0].outputSubscriptions['componentClicked']).toBeUndefined();
    expect(comp.hookIndex[0].outputSubscriptions['eventTriggered']).toBeDefined();
  });

  it('#should acceptInputsForAnyProperty, if requested', () => {
    const testText = `<dynhooks-singletagtest [thisPropertyDoesNotExist]="123">`;
    comp.content = testText;
    comp.options = { acceptInputsForAnyProperty: true };
    comp.ngOnChanges({content: true, options: true});
    let loadedComp = comp.hookIndex[0].componentRef.instance;

    // Expect property to be set regardless of whether or not it is declared as @Input() or not
    expect(loadedComp.thisPropertyDoesNotExist).toBe(123);

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { acceptInputsForAnyProperty: false };
    comp.ngOnChanges({content: true, options: true});
    loadedComp = comp.hookIndex[0].componentRef.instance;

    // Expect property not to be set when not declared as @Input()
    expect(loadedComp.thisPropertyDoesNotExist).toBeUndefined();
  });

  it('#should acceptOutputsForAnyObservable, if requested', () => {
    const testText = `<dynhooks-singletagtest (nonOutputEventEmitter)="123">`;
    comp.content = testText;
    comp.options = { acceptOutputsForAnyObservable: true };
    comp.ngOnChanges({content: true, options: true});

    // Expect property to be set regardless of whether or not it is declared as @Output() or not
    expect(comp.hookIndex[0].outputSubscriptions['nonOutputEventEmitter']).toBeDefined();

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { acceptOutputsForAnyObservable: false };
    comp.ngOnChanges({content: true, options: true});

    // Expect property not to be set when not declared as @Output()
    expect(comp.hookIndex[0].outputSubscriptions['nonOutputEventEmitter']).toBeUndefined();
  });

  // 4. GenericParser bindings
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
    const singleTagBindings = comp.activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings).length).toBe(2);

    // First singletag:
    expect(Object.keys(singleTagBindings[0].inputs).length).toBe(2);
    expect(singleTagBindings[0].inputs['simpleObject'].raw).toBe('{something: true, contextVar: context.order, nestedArray: [context.$lightSaberCollection]}');
    expect(singleTagBindings[0].inputs['simpleObject'].value).toEqual({something: true, contextVar: context.order, nestedArray: [context.$lightSaberCollection]});
    expect(Object.keys(singleTagBindings[0].inputs['simpleObject'].boundContextVariables).length).toBe(2);
    expect(singleTagBindings[0].inputs['simpleObject'].boundContextVariables['context.order']).toBe(66);
    expect(singleTagBindings[0].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toEqual(context.$lightSaberCollection);

    expect(singleTagBindings[0].inputs['simpleArray'].raw).toBe('[true]');
    expect(singleTagBindings[0].inputs['simpleArray'].value).toEqual([true]);
    expect(Object.keys(singleTagBindings[0].inputs['simpleArray'].boundContextVariables).length).toBe(0);

    expect(Object.keys(singleTagBindings[0].outputs).length).toBe(1);
    expect(singleTagBindings[0].outputs['httpResponseReceived'].raw).toBe('context.maneuvers.meditate()');
    expect(typeof singleTagBindings[0].outputs['httpResponseReceived'].value).toBe('function');
    expect(Object.keys(singleTagBindings[0].outputs['httpResponseReceived'].boundContextVariables).length).toBe(0);

    // Second singletag:
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['numberProp'].raw).toBe('567');
    expect(singleTagBindings[1].inputs['numberProp'].value).toBe(567);
    expect(Object.keys(singleTagBindings[1].inputs['numberProp'].boundContextVariables).length).toBe(0);

    // multitag hooks
    const multiTagBindings = comp.activeParsers[1]['currentBindings'];
    expect(Object.keys(multiTagBindings).length).toBe(1);

    // First multitag:
    expect(Object.keys(multiTagBindings[2].inputs).length).toBe(1);
    expect(multiTagBindings[2].inputs['fonts'].raw).toBe(`['arial', context.greeting]`);
    expect(multiTagBindings[2].inputs['fonts'].value).toEqual(['arial', context.greeting]);
    expect(Object.keys(multiTagBindings[2].inputs['fonts'].boundContextVariables).length).toBe(1);
    expect(multiTagBindings[2].inputs['fonts'].boundContextVariables['context.greeting']).toBe(context.greeting);
  });

  it('#should remove bindings that cannot be parsed', () => {
    const testText = `<dynhooks-singletagtest [numberProp]="12345" [simpleObject]="{color: 'blue', speed: 100">`; // <-- object has missing closing tag
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});

    // simpleObject should not be tracked
    const singleTagBindings = comp.activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[0].inputs).length).toBe(1);
    expect(singleTagBindings[0].inputs['numberProp'].value).toBe(12345);
  });

  it('#should preserve binding references on update if binding is static', () => {
    const testText = `<dynhooks-singletagtest [simpleObject]="{something: true, extra: 'hi, this is a string!'}">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {changeDetectionStrategy: 'default'};
    comp.ngOnChanges({content: true, context: true, options: true});

    // Check bindings
    const singleTagBindings = comp.activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[0].inputs).length).toBe(1);
    expect(singleTagBindings[0].inputs['simpleObject'].raw).toBe("{something: true, extra: 'hi, this is a string!'}");
    expect(singleTagBindings[0].inputs['simpleObject'].value).toEqual({something: true, extra: "hi, this is a string!"});
    expect(Object.keys(singleTagBindings[0].inputs['simpleObject'].boundContextVariables).length).toBe(0);

    spyOn(comp.activeParsers[0], 'updateBindings').and.callThrough();
    const previousRef = singleTagBindings[0].inputs['simpleObject'].value;

    // Trigger cd
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect(comp.activeParsers[0].updateBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[0].inputs['simpleObject'].value).toBe(previousRef);
  });

  it('#should preserve binding references on update if binding has bound context vars, but they have not changed', () => {
    const testText = `<dynhooks-singletagtest [simpleObject]="{something: context.$lightSaberCollection}">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {changeDetectionStrategy: 'default'};
    comp.ngOnChanges({content: true, context: true, options: true});

    // Check bindings
    const singleTagBindings = comp.activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[0].inputs).length).toBe(1);
    expect(singleTagBindings[0].inputs['simpleObject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(singleTagBindings[0].inputs['simpleObject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(singleTagBindings[0].inputs['simpleObject'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[0].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    spyOn(comp.activeParsers[0], 'updateBindings').and.callThrough();
    const previousRef = singleTagBindings[0].inputs['simpleObject'].value;

    // Trigger cd
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect(comp.activeParsers[0].updateBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[0].inputs['simpleObject'].value).toBe(previousRef);
  });

  it('#should preserve binding references on update if binding has bound context vars, and only their content has changed', () => {
    const testText = `<dynhooks-singletagtest [simpleObject]="{something: context.$lightSaberCollection}">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {changeDetectionStrategy: 'default'};
    comp.ngOnChanges({content: true, context: true, options: true});

    // Check bindings
    const singleTagBindings = comp.activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[0].inputs).length).toBe(1);
    expect(singleTagBindings[0].inputs['simpleObject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(singleTagBindings[0].inputs['simpleObject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(singleTagBindings[0].inputs['simpleObject'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[0].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    spyOn(comp.activeParsers[0], 'updateBindings').and.callThrough();
    const previousRef = singleTagBindings[0].inputs['simpleObject'].value;

    // Change content and trigger cd
    context.$lightSaberCollection.push('cyan');
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect(comp.activeParsers[0].updateBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[0].inputs['simpleObject'].value).toBe(previousRef);
  });

  it('#should change binding references on update if binding has bound context vars and they have changed', () => {
    const testText = `<dynhooks-singletagtest [simpleArray]="[context.order]" [simpleObject]="{something: context.$lightSaberCollection}">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {changeDetectionStrategy: 'default'};
    comp.ngOnChanges({content: true, context: true, options: true});

    // Check bindings
    const singleTagBindings = comp.activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[0].inputs).length).toBe(2);

    expect(singleTagBindings[0].inputs['simpleArray'].raw).toBe("[context.order]");
    expect(singleTagBindings[0].inputs['simpleArray'].value).toEqual([context.order]);
    expect(Object.keys(singleTagBindings[0].inputs['simpleArray'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[0].inputs['simpleArray'].boundContextVariables['context.order']).toBe(context.order);

    expect(singleTagBindings[0].inputs['simpleObject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(singleTagBindings[0].inputs['simpleObject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(singleTagBindings[0].inputs['simpleObject'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[0].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    spyOn(comp.activeParsers[0], 'updateBindings').and.callThrough();

    // Change bound property and trigger cd
    let previousArrayRef = singleTagBindings[0].inputs['simpleArray'].value;
    let previousObjectRef = singleTagBindings[0].inputs['simpleObject'].value;
    context.order = 77;
    context.$lightSaberCollection = ['cyan', 'viridian', 'turquoise'];
    comp.ngDoCheck();

    // Parser should have changed binding reference on reevaluation
    expect(comp.activeParsers[0].updateBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[0].inputs['simpleArray'].value).not.toBe(previousArrayRef);
    expect(singleTagBindings[0].inputs['simpleObject'].value).not.toBe(previousObjectRef);

    // Test identical by value:
    // If object, binding reference should change even if new context prop is identical by value, as the reference is still different.
    // If primitive, binding reference should not change if identical as they are not compared by reference.
    previousArrayRef = singleTagBindings[0].inputs['simpleArray'].value;
    previousObjectRef = singleTagBindings[0].inputs['simpleObject'].value;
    context.order = 77;
    context.$lightSaberCollection = ['cyan', 'viridian', 'turquoise'];
    comp.ngDoCheck();
    expect(comp.activeParsers[0].updateBindings['calls'].count()).toBe(2);
    expect(singleTagBindings[0].inputs['simpleArray'].value).toBe(previousArrayRef);
    expect(singleTagBindings[0].inputs['simpleObject'].value).not.toBe(previousObjectRef);
  });

  // 5. GenericParser options
  // --------------------------------------------------------------------------

  it('#should recognize custom selectors', () => {
    ({fixture, comp} = prepareTestingModule([{
      component: MultiTagTestComponent,
      selector: 'atotallycustomselector'
    }]));

    const testText = `<p>This is a custom selector: <atotallycustomselector [someInput]="true">for the multitag component</atotallycustomselector>.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML).toBe('for the multitag component');
  });

  it('#should recognize custom injectors', () => {
    const testText = `<dynhooks-singletagtest>`;

    // Without custom injector, fakeTestService should be null
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      multiTag: false,
    }]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    expect(comp.hookIndex[0].componentRef.instance.fakeTestService).toBeNull();

    // With custom injector, fakeTestService should be set
    const customInjector = Injector.create({
      providers: [{provide: TESTSERVICETOKEN, useValue: { name: 'test value' } }]
    });
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      multiTag: false,
      injector: customInjector
    }]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    expect(comp.hookIndex[0].componentRef.instance.fakeTestService).toEqual({ name: 'test value' });
  });

  it('#should recognize singletag hooks', () => {
    ({fixture, comp} = prepareTestingModule([{
      component: MultiTagTestComponent,
      multiTag: false
    }]));

    const testText = `<p>Here the multitag hook is set to be single tag instead: <dynhooks-multitagtest [fonts]="['arial', 'calibri']">text within hook</dynhooks-multitagtest></p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML).toBe('');
    expect(fixture.nativeElement.childNodes[0].childNodes[2].textContent).toContain('text within hook');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[0].componentRef.instance.fonts).toEqual(['arial', 'calibri']);
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
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML).toBe('text within hook');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[0].componentRef.instance.fonts).toEqual(['arial', 'calibri']);
  });

  it('#should refrain from parsing inputs, if requested', () => {
    ({fixture, comp} = prepareTestingModule([{
      component: MultiTagTestComponent,
      parseInputs: false,
      changeDetectionStrategy: 'Default'
    }]));

    const testText = `<p>Here is a hook whose input shall not be parsed: <dynhooks-multitagtest [nr]="123" [fonts]="['arial', {prop: true}]">text within hook</dynhooks-multitagtest></p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML).toBe('text within hook');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[0].componentRef.instance.nr).toEqual('123');                          // <-- Must be string, not number
    expect(comp.hookIndex[0].componentRef.instance.fonts).toEqual("['arial', {prop: true}]");   // <-- Must be string, not array

    // Expect them to still be unparsed after update
    spyOn(comp['componentUpdater'], 'refresh').and.callThrough();
    comp.ngDoCheck();
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(1);
    expect(comp.hookIndex[0].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[0].componentRef.instance.nr).toEqual('123');
    expect(comp.hookIndex[0].componentRef.instance.fonts).toEqual("['arial', {prop: true}]");
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
      multiTag: false,
      unescapeStrings: true
    }]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    let loadedComp = comp.hookIndex[0].componentRef.instance;

    expect(loadedComp.stringProp).toBe("This is a 'test' string.");
    expect(loadedComp.simpleObject).toEqual({someProp: "His name was O'Hara."});
    expect(loadedComp.simpleArray).toEqual(["defending O'Hara!"]);

    // Leave strings as they are
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      multiTag: false,
      unescapeStrings: false
    }]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    loadedComp = comp.hookIndex[0].componentRef.instance;

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
    ({fixture, comp} = prepareTestingModule([{component: SingleTagTestComponent, multiTag: false, inputsBlacklist: ['numberProp']}]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    let loadedComp = comp.hookIndex[0].componentRef.instance;

    expect(loadedComp.stringProp).toBe('this is an example string');
    expect(loadedComp.numberProp).toBeUndefined();
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[0].outputSubscriptions.componentClicked).toBeDefined();
    expect(comp.hookIndex[0].outputSubscriptions.eventTriggered).toBeDefined();
    expect(comp.hookIndex[0].outputSubscriptions.httpResponseReceived).toBeDefined();

    // b) Test inputWhitelist
    ({fixture, comp} = prepareTestingModule([{component: SingleTagTestComponent, multiTag: false, inputsWhitelist: ['simpleArray']}]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    loadedComp = comp.hookIndex[0].componentRef.instance;

    expect(loadedComp.stringProp).toBeUndefined();
    expect(loadedComp.numberProp).toBeUndefined();
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[0].outputSubscriptions.componentClicked).toBeDefined();
    expect(comp.hookIndex[0].outputSubscriptions.eventTriggered).toBeDefined();
    expect(comp.hookIndex[0].outputSubscriptions.httpResponseReceived).toBeDefined();

    // c) Test inputBlacklist + inputWhitelist
    ({fixture, comp} = prepareTestingModule([{component: SingleTagTestComponent, multiTag: false, inputsBlacklist: ['simpleArray'], inputsWhitelist: ['simpleArray', 'numberProp']}]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    loadedComp = comp.hookIndex[0].componentRef.instance;

    expect(loadedComp.stringProp).toBeUndefined();
    expect(loadedComp.numberProp).toBe(917);
    expect(loadedComp.simpleArray).toBeUndefined();
    expect(comp.hookIndex[0].outputSubscriptions.componentClicked).toBeDefined();
    expect(comp.hookIndex[0].outputSubscriptions.eventTriggered).toBeDefined();
    expect(comp.hookIndex[0].outputSubscriptions.httpResponseReceived).toBeDefined();

    // d) Test outputBlacklist
    ({fixture, comp} = prepareTestingModule([{component: SingleTagTestComponent, multiTag: false, outputsBlacklist: ['eventTriggeredAlias']}]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    loadedComp = comp.hookIndex[0].componentRef.instance;

    expect(loadedComp.stringProp).toBe('this is an example string');
    expect(loadedComp.numberProp).toBe(917);
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[0].outputSubscriptions.componentClicked).toBeDefined();
    expect(comp.hookIndex[0].outputSubscriptions.eventTriggered).toBeUndefined();
    expect(comp.hookIndex[0].outputSubscriptions.httpResponseReceived).toBeDefined();

    // e) Test outputWhitelist
    ({fixture, comp} = prepareTestingModule([{component: SingleTagTestComponent, multiTag: false, outputsWhitelist: ['httpResponseReceived']}]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    loadedComp = comp.hookIndex[0].componentRef.instance;

    expect(loadedComp.stringProp).toBe('this is an example string');
    expect(loadedComp.numberProp).toBe(917);
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[0].outputSubscriptions.componentClicked).toBeUndefined();
    expect(comp.hookIndex[0].outputSubscriptions.eventTriggered).toBeUndefined();
    expect(comp.hookIndex[0].outputSubscriptions.httpResponseReceived).toBeDefined();

    // f) Test outputBlacklist + outputWhitelist
    ({fixture, comp} = prepareTestingModule([{component: SingleTagTestComponent, multiTag: false, outputsBlacklist: ['httpResponseReceived'], outputsWhitelist: ['eventTriggeredAlias', 'httpResponseReceived']}]));
    comp.content = testText;
    comp.ngOnChanges({content: true});
    loadedComp = comp.hookIndex[0].componentRef.instance;

    expect(loadedComp.stringProp).toBe('this is an example string');
    expect(loadedComp.numberProp).toBe(917);
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[0].outputSubscriptions.componentClicked).toBeUndefined();
    expect(comp.hookIndex[0].outputSubscriptions.eventTriggered).toBeDefined();
    expect(comp.hookIndex[0].outputSubscriptions.httpResponseReceived).toBeUndefined();
  });

  it('#should disallow context access, if requested', () => {
    const testText = `<dynhooks-singletagtest [numberProp]="context.order" (httpResponseReceived)="context.maneuvers.meditate()">`;

    // Context access allowed
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      multiTag: false,
      allowContextInBindings: true
    }]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    let loadedComp = comp.hookIndex[0].componentRef.instance;
    spyOn(context.maneuvers, 'meditate').and.callThrough();

    expect(loadedComp.numberProp).toBe(66);
    loadedComp.httpResponseReceived.emit(200);
    expect(context.maneuvers.meditate['calls'].count()).toBe(1);

    // Context access not allowed
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      multiTag: false,
      allowContextInBindings: false
    }]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    loadedComp = comp.hookIndex[0].componentRef.instance;

    expect(loadedComp.numberProp).toBe(undefined);
    loadedComp.httpResponseReceived.emit(300);
    expect(context.maneuvers.meditate['calls'].count()).toBe(1); // Should not have increased from before
  });

  it('#should disallow context function calls, if requested', () => {
    const testText = `<dynhooks-singletagtest [stringPropAlias]="context.maneuvers.defend('the innocent')" (httpResponseReceived)="context.maneuvers.meditate()">`;

    // Context access allowed
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      multiTag: false,
      allowContextFunctionCalls: true
    }]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    let loadedComp = comp.hookIndex[0].componentRef.instance;
    spyOn(context.maneuvers, 'meditate').and.callThrough();

    expect(loadedComp.stringProp).toBe('defending the innocent!');
    loadedComp.httpResponseReceived.emit(200);
    expect(context.maneuvers.meditate['calls'].count()).toBe(1);

    // Context access not allowed
    ({fixture, comp} = prepareTestingModule([{
      component: SingleTagTestComponent,
      multiTag: false,
      allowContextFunctionCalls: false
    }]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    loadedComp = comp.hookIndex[0].componentRef.instance;

    expect(loadedComp.stringProp).toBe(undefined);
    loadedComp.httpResponseReceived.emit(200);
    expect(context.maneuvers.meditate['calls'].count()).toBe(1); // Should not have increased from before
  });

});
