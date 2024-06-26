// Testing api resources
import { DynamicHooksComponent, HookFinder, SelectorHookParser, anchorElementTag, provideDynamicHooks } from '../../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule, testParsers } from '../shared';
import { SingleTagTestComponent } from '../../resources/components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from '../../resources/components/multiTagTest/multiTagTest.c';
import { NonServiceTestParser } from '../../resources/parsers/nonServiceTestParser';
import { GenericSingleTagStringParser } from '../../resources/parsers/genericSingleTagStringParser';
import { GenericMultiTagStringParser } from '../../resources/parsers/genericMultiTagStringParser';
import { GenericWhateverStringParser } from '../../resources/parsers/genericWhateverStringParser';
import { TestBed } from '@angular/core/testing';
import { GenericWhateverElementParser } from '../../resources/parsers/genericWhateverElementParser';
import { GenericMultiTagElementParser } from '../../resources/parsers/genericMultiTagElementParser';

describe('Parser configuration', () => {
  let testBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should load global parsers correctly', () => {
    comp.content = 'something';
    comp.ngOnChanges({content: true} as any);

    expect(comp.activeParsers.length).toBe(8);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(GenericSingleTagStringParser));
    expect(comp.activeParsers[1]).toEqual(jasmine.any(GenericMultiTagStringParser));
    expect(comp.activeParsers[2]).toEqual(jasmine.any(GenericWhateverStringParser));
    expect(comp.activeParsers[3]).toEqual(jasmine.any(GenericMultiTagElementParser));
    expect(comp.activeParsers[4]).toEqual(jasmine.any(GenericWhateverElementParser));
    expect(comp.activeParsers[5]).toEqual(jasmine.any(SelectorHookParser));
    expect(comp.activeParsers[6]).toEqual(jasmine.any(SelectorHookParser));
    expect(comp.activeParsers[7]).toEqual(jasmine.any(SelectorHookParser));
    expect((comp.activeParsers[0] as any).component.prototype.constructor.name).toBe('SingleTagTestComponent');
    expect((comp.activeParsers[1] as any).component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.activeParsers[2] as any).component.prototype.constructor.name).toBe('WhateverTestComponent');
    expect((comp.activeParsers[3] as any).component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.activeParsers[4] as any).component.prototype.constructor.name).toBe('WhateverTestComponent');
    expect((comp.activeParsers[5] as any)['config'].component.prototype.constructor.name).toBe('SingleTagTestComponent');
    expect((comp.activeParsers[6] as any)['config'].component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.activeParsers[7] as any)['config'].component.prototype.constructor.name).toBe('WhateverTestComponent');
  });

  it('#should load local parsers correctly', () => {
    comp.content = 'something';
    comp.parsers = [GenericWhateverStringParser];
    comp.ngOnChanges({content: true, parsers: true} as any);

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0] instanceof GenericWhateverStringParser).toBeTrue();
    expect((comp as any).activeParsers[0].component.prototype.constructor.name).toBe('WhateverTestComponent');
  });

  it('#should be able to load parsers in their various forms', () => {
    ({comp, fixture} = prepareTestingModule(() => [
      provideDynamicHooks({parsers: []})
    ]));

    // Should be able to load parsers that are just component classes (SelectorHookParser)
    comp.content = 'This is a sentence with a <multitagtest></multitagtest>.';
    comp.parsers = [MultiTagTestComponent];
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('SelectorHookParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <' + anchorElementTag);
    expect(fixture.nativeElement.children[0].tagName).toBe(anchorElementTag.toUpperCase());
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBeNull();

    // Should be able to load parsers that are object literals (SelectorHookParser)
    comp.content = 'This is a sentence with a <singletagtest>.';
    comp.parsers = [{component: SingleTagTestComponent, enclosing: false}];
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('SelectorHookParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <' + anchorElementTag);
    expect(fixture.nativeElement.children[0].tagName).toBe(anchorElementTag.toUpperCase());
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should be able to load parsers that are services
    comp.content = 'This is a sentence with a [singletag-string].';
    comp.parsers = [GenericSingleTagStringParser];
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('GenericSingleTagStringParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <' + anchorElementTag);
    expect(fixture.nativeElement.children[0].tagName).toBe(anchorElementTag.toUpperCase());
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should be able to load parsers that are classes
    comp.content = 'This is a sentence with a customhook.';
    comp.parsers = [NonServiceTestParser];
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('NonServiceTestParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <' + anchorElementTag);
    expect(fixture.nativeElement.children[0].tagName).toBe(anchorElementTag.toUpperCase());
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should be able to load parsers that are instances
    comp.content = 'This is a sentence with a customhook.';
    comp.parsers = [new NonServiceTestParser()];
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('NonServiceTestParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <' + anchorElementTag);
    expect(fixture.nativeElement.children[0].tagName).toBe(anchorElementTag.toUpperCase());
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should ignore invalid parser entries
    comp.content = 'This text is irrelevant for this test.';
    comp.parsers = [true as any];
    spyOn(console, 'error').and.callThrough();
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(0);
    expect((<any> console.error)['calls'].count()).toBe(1);
  });

  it('#should load fine without parsers', () => {
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: []
      })
    ]));

    comp.content = 'something';
    comp.ngOnChanges({content: true} as any);

    expect(comp.activeParsers.length).toBe(0);
    expect(fixture.nativeElement.innerHTML.trim()).toBe('something');
  });

  it('#should check parser names', () => {
    comp.content = 'This text is irrelevant for this test.';
    comp.parsers = [GenericSingleTagStringParser, GenericMultiTagStringParser];
    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    const genericMultiTagParser = TestBed.inject(GenericMultiTagStringParser);
    (genericSingleTagParser as any).name = 'IdenticalParserName';
    (genericMultiTagParser as any).name = 'IdenticalParserName';
    spyOn(console, 'warn').and.callThrough();
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(2);
    expect((<any> console.warn)['calls'].count()).toBe(1);
    expect((<any> console.warn)['calls'].mostRecent().args[0]).toBe('Parser name "IdenticalParserName" is not unique and appears multiple times in the list of active parsers.');
  });

  it('#should apply the parserBlacklist and parserWhitelist, if requested', () => {
    const testText = `
      <p>[singletag-string]</p>
      <p>[multitag-string][/multitag-string]</p>
      <p>[whatever-string][/whatever-string]</p>
    `;
    comp.content = testText;
    (comp as any).globalParsersBlacklist = null;
    (comp as any).globalParsersWhitelist = null;
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true} as any);

    // Expect that no component is filtered
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.whatever-component')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(3);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[3].componentRef!.instance.constructor.name).toBe('WhateverTestComponent');

    // Blacklist: Expect that GenericMultiTagStringParser is not loaded
    ({testBed, fixture, comp, context} = defaultBeforeEach());
    comp.content = testText;
    comp.globalParsersBlacklist = ['GenericMultiTagStringParser'];
    (comp as any).globalParsersWhitelist = null;
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true} as any);

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.whatever-component')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('WhateverTestComponent');

    // WhiteList: Expect that only GenericWhateverStringParser is loaded
    ({testBed, fixture, comp, context} = defaultBeforeEach());
    comp.content = testText;
    (comp as any).globalParsersBlacklist = null;
    comp.globalParsersWhitelist = ['GenericWhateverStringParser'];
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true} as any);

    expect(fixture.nativeElement.querySelector('.singletag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.whatever-component')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('WhateverTestComponent');

    // Both: Expect that only GenericSingleTagStringParser is loaded
    ({testBed, fixture, comp, context} = defaultBeforeEach());
    comp.content = testText;
    comp.globalParsersBlacklist = ['GenericMultiTagStringParser'];
    comp.globalParsersWhitelist = ['GenericSingleTagStringParser', 'GenericMultiTagStringParser'];
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true} as any);

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.whatever-component')).toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
  });

  it('#should check the parserBlacklist and parserWhitelist', () => {
    const testText = 'This text is irrelevant for this test';
    comp.content = testText;
    comp.globalParsersBlacklist = ['blacklistedParser'];
    comp.globalParsersWhitelist = ['whitelistedParser'];
    spyOn(console, 'warn').and.callThrough();
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true} as any);

    // Check that warnings have been fired
    expect((<any>console.warn)['calls'].count()).toBe(2);
    expect((<any>console.warn)['calls'].allArgs()[0][0]).toBe('Blacklisted parser name "blacklistedParser" does not appear in the list of global parsers names. Make sure both spellings are identical.');
    expect((<any>console.warn)['calls'].allArgs()[1][0]).toBe('Whitelisted parser name "whitelistedParser" does not appear in the list of global parsers names. Make sure both spellings are identical.');
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
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(0);
    expect((<any> console.error)['calls'].count()).toBe(1);
    expect((<any> console.error)['calls'].mostRecent().args[0]).toBe('Submitted parser neither implements "findHooks()" nor "findHookElements()". One is required. Removing from list of active parsers:');

    comp.parsers = [parseWithOneFunc as any];
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(0);
    expect((<any> console.error)['calls'].count()).toBe(2);
    expect((<any> console.error)['calls'].mostRecent().args[0]).toBe('Submitted parser does not implement "loadComponent()". Removing from list of active parsers:');

    comp.parsers = [parseWithTwoFuncs as any];
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(0);
    expect((<any> console.error)['calls'].count()).toBe(3);
    expect((<any> console.error)['calls'].mostRecent().args[0]).toBe('Submitted parser does not implement "getBindings()". Removing from list of active parsers:');
  });

});
