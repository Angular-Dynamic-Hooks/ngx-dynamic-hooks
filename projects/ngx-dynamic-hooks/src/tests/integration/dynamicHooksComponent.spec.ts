// Testing api resources
import { DynamicHooksComponent } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule } from './shared';
import { TestBed } from '@angular/core/testing';
import { GenericMultiTagStringParser } from '../resources/parsers/genericMultiTagStringParser';


describe('DynamicHooksComponent', () => {
  let testBed: TestBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });
  
  
  // Initialize DynamicHookComponent
  // -------------------------------------------------------------

  it('#should have created the main component correctly', () => {
    expect(comp).toBeDefined();
  });

  it('#should throw error if not registered main providers before using DynamicHooksComponent', (async () => {
    expect(() => {
      ({fixture, comp} = prepareTestingModule(() => []));
    }).toThrow(new Error('It seems you\'re trying to use ngx-dynamic-hooks library without registering its providers first. To do so, call the "provideDynamicHooks" function in the main providers array of your app.'));
  })); 

  it('#should call DynamicHooksService to parse components', () => {
    expect(comp).toBeDefined();
    spyOn(comp, 'parse').and.callThrough();
    spyOn(comp['dynamicHooksService'], 'parse').and.callThrough();

    comp.ngOnChanges({content: true} as any);

    expect((comp.parse as any)['calls'].count()).toBe(1);
    expect((comp['dynamicHooksService'].parse as any)['calls'].count()).toBe(1);
  });

  it('#should call DynamicHooksService to destroy all dynamic components when destroyed itself', () => {
    expect(comp).toBeDefined();
    spyOn(comp, 'parse').and.callThrough();
    spyOn(comp['dynamicHooksService'], 'destroy').and.callThrough();

    comp.ngOnDestroy();

    expect((comp['dynamicHooksService'].destroy as any)['calls'].count()).toBe(1);
  });

  it('#should reset and reload when relevant bindings change', () => {
    spyOn(comp, 'parse').and.callThrough();
    spyOn(comp, 'reset').and.callThrough();

    // Initialize
    const testTextOne = `<div>Some random component [multitag-string]with inner content.[/multitag-string]></div>`;
    comp.content = testTextOne;
    comp.ngOnChanges({content: true} as any);
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.parse as any)['calls'].count()).toBe(1);

    // Change 'content'
    const testTextTwo = `<span>Some other text [singletag-string][multitag-string][/multitag-string]</span>`;
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
    const blacklist = ['GenericSingleTagStringParser'];
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
    const whitelist = ['GenericSingleTagStringParser'];
    comp.globalParsersWhitelist = whitelist;
    comp.ngOnChanges({globalParsersWhitelist: true} as any);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect((comp as any).parse['calls'].count()).toBe(6);

    // Change 'parsers' (while leaving 'globalParsersWhitelist' as is, should be ignored)
    comp.parsers = [GenericMultiTagStringParser];
    comp.ngOnChanges({parsers: true} as any);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(GenericMultiTagStringParser));
    expect((comp as any).activeParsers[0].component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.activeParsers[0]['name']).toBe('GenericMultiTagStringParser');
    expect((comp as any).parse['calls'].count()).toBe(7);
  });

});