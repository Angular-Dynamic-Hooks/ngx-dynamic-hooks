// Testing api resources
import { AutoPlatformService, DYNAMICHOOKS_ALLSETTINGS, DynamicHooksComponent, PlatformService, SelectorHookParserConfig, getParseOptionDefaults, provideDynamicHooks } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule } from './shared';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { TestBed } from '@angular/core/testing';
import { GenericSingleTagStringParser } from '../resources/parsers/genericSingleTagStringParser';
import { GenericMultiTagStringParser } from '../resources/parsers/genericMultiTagStringParser';


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
    const testText = `<p>This p-element has a <span>span-element with a component [singletag-string]></span> within it.</p>`;

    // Test with config for SingleTagTestComponent
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [GenericSingleTagStringParser]
      })
    ]));
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(GenericSingleTagStringParser));
    expect((comp.activeParsers[0] as any).component.prototype.constructor.name).toBe('SingleTagTestComponent');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    
    // Test with config for MultiTagTestComponent
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({parsers: [GenericMultiTagStringParser]})
    ]));
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(GenericMultiTagStringParser));
    expect((comp.activeParsers[0] as any).component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect(Object.keys(comp.hookIndex).length).toBe(0);
  });

  it('#should reset allSettings on app reloads', (async () => {
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [GenericSingleTagStringParser]
      })
    ]));

    let allSettings = testBed.inject(DYNAMICHOOKS_ALLSETTINGS);
    expect(allSettings.length).toBe(1);
    expect(allSettings[0].parsers?.length).toBe(1);
    expect(allSettings[0].parsers![0]).toBe(GenericSingleTagStringParser);

    // Reset and reload with different settings
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [GenericMultiTagStringParser]
      })
    ]));

    allSettings = testBed.inject(DYNAMICHOOKS_ALLSETTINGS);
    expect(allSettings.length).toBe(1);
    expect(allSettings[0].parsers?.length).toBe(1);
    expect(allSettings[0].parsers![0]).toBe(GenericMultiTagStringParser);
  }));

  it('#should not crash if the user does not call provideDynamicHooks at all', () => {
    const testText = `<p>This p-element has a <span>span-element with a component [singletag-string]></span> within it.</p>`;

    testBed.resetTestingModule();
    ({fixture, comp} = prepareTestingModule(() => []));
    comp.content = testText;
    comp.parsers = [GenericSingleTagStringParser];
    comp.ngOnChanges({content: true} as any);

    expect(comp['dynamicHooksService']['allSettings']).toBe(null);
    expect(comp['dynamicHooksService']['ancestorSettings']).toBe(null);
    expect(comp['dynamicHooksService']['moduleSettings']).toBe(null);

    // Options should be default
    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toEqual((getParseOptionDefaults() as any)[key]);
    }

    // Should load component even without global settings
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(GenericSingleTagStringParser));
    expect((comp.activeParsers[0] as any).component.prototype.constructor.name).toBe('SingleTagTestComponent');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
  });

  it('#should not crash if the user passes no arguments to provideDynamicHooks()', () => {
    const testText = `<p>This is just a bit of text.</p>`;

    testBed.resetTestingModule();
    let {fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks()
    ]);

    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(comp['dynamicHooksService']['allSettings']!.length).toBe(0);
    expect(comp['dynamicHooksService']['ancestorSettings']!.length).toBe(0);
    expect(comp['dynamicHooksService']['moduleSettings']).toBeUndefined();
    expect(fixture.nativeElement.innerHTML.trim()).toBe(testText);

    // Options should be default
    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toEqual((getParseOptionDefaults() as any)[key]);
    }

    // Parsers should be empty
    expect(comp.activeParsers.length).toBe(0);
  });

  it('#should not crash if the user passes an empty object as global settings', () => {
    const testText = `<p>This is just a bit of text.</p>`;

    testBed.resetTestingModule();
    let {fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({})
    ]);

    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(comp['dynamicHooksService']['allSettings']!.length).toBe(1);
    expect(comp['dynamicHooksService']['allSettings']![0]).toEqual({});
    expect(comp['dynamicHooksService']['ancestorSettings']!.length).toBe(1);
    expect(comp['dynamicHooksService']['ancestorSettings']![0]).toEqual({});
    expect(comp['dynamicHooksService']['moduleSettings']).toEqual({});
    expect(fixture.nativeElement.innerHTML.trim()).toBe(testText);

    // Options should be default
    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toEqual((getParseOptionDefaults() as any)[key]);
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

  it('#should set platformService provider to custom platformService if passed', () => {
    const CustomPlatformService = class {
    };

    const providers = provideDynamicHooks({}, CustomPlatformService as any);
    const platformServiceProvider = providers.find((p: any) => p.useClass === CustomPlatformService);
    expect(platformServiceProvider).not.toBeUndefined();
  });

  it('#should use user-provided platformService methods, if available', () => {
    class UserPlatformService implements PlatformService {
      getTagName(element: any) {
        return 'TESTTAGNAME';
      }  
    }

    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({}, UserPlatformService)
    ]));

    // Make sure AutoPlatformService used UserPlatformService method
    const autoPlatformService = TestBed.inject(AutoPlatformService);
    const tagName = autoPlatformService.getTagName(document.createElement('div'));
    expect(tagName).toBe('TESTTAGNAME');

    // If method not defined in UserPlatformService, AutoPlatformService should fallback to defaultPlatformService methods
    const createdElement = autoPlatformService.createElement('h1');
    expect(createdElement.tagName).toBe('H1');
  });
});
