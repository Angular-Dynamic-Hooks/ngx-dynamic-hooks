// Testing api resources
import { DYNAMICHOOKS_ALLSETTINGS, DynamicHooksComponent, GeneralPlatformService, SelectorHookParserConfig, outletOptionDefaults, provideDynamicHooks, provideDynamicHooksForChild } from '../testing-api';
import { SelectorHookParser } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule } from './shared';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { TestBed } from '@angular/core/testing';


describe('Initialization', () => {
  let testBed: TestBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // Initialize provide methods
  // -------------------------------------------------------------

  it('#should load the global settings correctly', () => {
    const testText = `<p>This p-element has a <span>span-element with a component <dynHooks-singletagtest></span> within it.</p>`;

    // Test with config for SingleTagTestComponent
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false
        }]
      })
    ]));
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(SelectorHookParser));
    expect((comp.activeParsers[0] as any)['config'].component.prototype.constructor.name).toBe('SingleTagTestComponent');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    
    // Test with config for MultiTagTestComponent
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({parsers: [{
        component: MultiTagTestComponent
      }]})
    ]));
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(SelectorHookParser));
    expect((comp.activeParsers[0] as any)['config'].component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect(Object.keys(comp.hookIndex).length).toBe(0);
  });

  it('#should reset allSettings on app reloads', (async () => {
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [
          {component: SingleTagTestComponent}
        ]
      })
    ]));

    let allSettings = testBed.inject(DYNAMICHOOKS_ALLSETTINGS);
    expect(allSettings.length).toBe(1);
    expect(allSettings[0].parsers?.length).toBe(1);
    expect((allSettings[0].parsers![0] as SelectorHookParserConfig).component).toBe(SingleTagTestComponent);

    // Reset and reload with different settings
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [
          {component: MultiTagTestComponent}
        ]
      })
    ]));

    allSettings = testBed.inject(DYNAMICHOOKS_ALLSETTINGS);
    expect(allSettings.length).toBe(1);
    expect(allSettings[0].parsers?.length).toBe(1);
    expect((allSettings[0].parsers![0] as SelectorHookParserConfig).component).toBe(MultiTagTestComponent);
  }));

  it('#should not crash if the user passes an empty object as global settings', () => {
    const testText = `<p>This is just a bit of text.</p>`;

    testBed.resetTestingModule();
    let {fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({})
    ]);

    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(comp['dynamicHooksService']['allSettings'].length).toBe(1);
    expect(comp['dynamicHooksService']['allSettings'][0]).toEqual({});
    expect(comp['dynamicHooksService']['moduleSettings']).toEqual({});
    expect(fixture.nativeElement.innerHTML.trim()).toBe(testText);

    // Options should be default
    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toBe((outletOptionDefaults as any)[key]);
    }

    // Parsers should be empty
    expect(comp.activeParsers.length).toBe(0);
  });

  it('#it should allow directly accepting a parsers array as a shorthand instead of a full settings object in provideDynamicHooks', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideDynamicHooks([MultiTagTestComponent, {component: SingleTagTestComponent, enclosing: false}])
      ]
    });

    let allSettings = TestBed.inject(DYNAMICHOOKS_ALLSETTINGS);
    expect(allSettings.length).toBe(1);
    expect(allSettings[0].parsers!.length).toBe(2);
    expect(allSettings[0].parsers![0]).toBe(MultiTagTestComponent);
    expect((allSettings[0].parsers![1] as SelectorHookParserConfig).component).toBe(SingleTagTestComponent);
  });

  it('#it should allow directly accepting a parsers array as a shorthand instead of a full settings object in provideDynamicHooksForChild', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideDynamicHooks([]),
        provideDynamicHooksForChild([MultiTagTestComponent, {component: SingleTagTestComponent, enclosing: false}])
      ]
    });

    let allSettings = TestBed.inject(DYNAMICHOOKS_ALLSETTINGS);
    expect(allSettings.length).toBe(2);
    expect(allSettings[1].parsers!.length).toBe(2);
    expect(allSettings[1].parsers![0]).toBe(MultiTagTestComponent);
    expect((allSettings[1].parsers![1] as SelectorHookParserConfig).component).toBe(SingleTagTestComponent);
  });

  it('#should set platformService provider to custom platformService if passed', () => {
    const CustomPlatformService = class {
    };

    const providers = provideDynamicHooks({}, CustomPlatformService as any);
    const platformServiceProvider = providers.find((p: any) => p.useClass === CustomPlatformService);
    expect(platformServiceProvider).not.toBeUndefined();
  });

  it('#should set platformService to PlatformBrowserService if custom platform not passed', () => {
    const providers = provideDynamicHooks({});
    const platformServiceProvider = providers.find((p: any) => p.useClass === GeneralPlatformService);
    expect(platformServiceProvider).not.toBeUndefined();
  });

  // Initialize DynamicHookComponent
  // -------------------------------------------------------------

  it('#should throw error if not registered main providers before using DynamicHooksComponent', (async () => {
    expect(() => {
      ({fixture, comp} = prepareTestingModule(() => []));
    }).toThrow(new Error('It seems you\'re trying to use ngx-dynamic-hooks library without registering its providers first. To do so, call the "provideDynamicHooks" function in the main providers array of your app.'));
  }));

  it('#should have created the main component correctly', () => {
    expect(comp).toBeDefined();
  });

  it('#should reset and reload when relevant bindings change', () => {
    spyOn(comp, 'parse').and.callThrough();
    spyOn(comp, 'reset').and.callThrough();

    // Initialize
    const testTextOne = `<div>Some random component <dynHooks-multitagtest>with inner content.</dynHooks-multitagtest></div>`;
    comp.content = testTextOne;
    comp.ngOnChanges({content: true} as any);
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.parse as any)['calls'].count()).toBe(1);

    // Change 'text'
    const testTextTwo = `<span>Some other text <dynHooks-singletagtest><dynHooks-multitagtest></dynHooks-multitagtest></span>`;
    comp.content = testTextTwo;
    comp.ngOnChanges({content: true} as any);
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(Object.values(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.parse as any)['calls'].count()).toBe(2);

    // Change 'options'
    const newOptions = {sanitize: false};
    comp.options = newOptions;
    comp.ngOnChanges({options: true} as any);
    expect((comp.parse as any)['calls'].count()).toBe(3);

    // Change 'globalParsersBlacklist'
    const blacklist = ['SingleTagTestComponentParser'];
    comp.globalParsersBlacklist = blacklist;
    comp.ngOnChanges({globalParsersBlacklist: true} as any);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.parse as any)['calls'].count()).toBe(4);

    // Reset
    (comp as any).globalParsersBlacklist  = null;
    (comp as any).globalParsersWhitelist = null;
    comp.ngOnChanges({globalParsersBlacklist: true, globalParsersWhitelist: true} as any);
    expect(Object.values(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp as any).parse['calls'].count()).toBe(5);

    // Change 'globalParsersWhitelist'
    const whitelist = ['SingleTagTestComponentParser'];
    comp.globalParsersWhitelist = whitelist;
    comp.ngOnChanges({globalParsersWhitelist: true} as any);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect((comp as any).parse['calls'].count()).toBe(6);

    // Change 'parsers' (while leaving 'globalParsersWhitelist' as is, should be ignored)
    comp.parsers = [{component: MultiTagTestComponent, name: 'LocalParser!'}];
    comp.ngOnChanges({parsers: true} as any);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(SelectorHookParser));
    expect((comp as any).activeParsers[0]['config'].component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.activeParsers[0]['name']).toBe('LocalParser!');
    expect((comp as any).parse['calls'].count()).toBe(7);
  });
});
