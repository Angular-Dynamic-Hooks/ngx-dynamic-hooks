// Testing api resources
import { outletOptionDefaults } from '../testing-api';
import { SelectorHookParser } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule } from './shared';
import { OutletComponentWithProviders } from '../resources/components/OutletComponentWithProviders';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';


describe('Initialization', () => {
  let testBed;
  let fixture: any;
  let comp: OutletComponentWithProviders;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

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
    comp.ngOnChanges({content: true} as any);

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(SelectorHookParser));
    expect((comp.activeParsers[0] as any)['config'].component.prototype.constructor.name).toBe('SingleTagTestComponent');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');

    // Test with config for MultiTagTestComponent
    ({fixture, comp} = prepareTestingModule([{
      component: MultiTagTestComponent
    }]));
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(SelectorHookParser));
    expect((comp.activeParsers[0] as any)['config'].component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect(Object.keys(comp.hookIndex).length).toBe(0);
  });

  it('#should not crash if the user passes an empty object as global settings', () => {
    const testText = `<p>This is just a bit of text.</p>`;

    ({fixture, comp} = prepareTestingModule());
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(comp['outletService']['allSettings'].length).toBe(1);
    expect(comp['outletService']['allSettings'][0]).toEqual({});
    expect(comp['outletService']['moduleSettings']).toEqual({});
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
