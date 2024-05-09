// Testing api resources
import { SelectorHookParser } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule, testParsers } from './shared';
import { OutletComponentWithProviders } from '../resources/components/OutletComponentWithProviders';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { InlineTestComponent } from '../resources/components/inlineTest/inlineTest.c';
import { ServiceTestParser } from '../resources/parsers/serviceTestParser';
import { NonServiceTestParser } from '../resources/parsers/nonServiceTestParser';

describe('Parsers', () => {
  let testBed;
  let fixture: any;
  let comp: OutletComponentWithProviders;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should load global parsers correctly', () => {
    comp.content = 'something';
    comp.ngOnChanges({content: true} as any);

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
    comp.ngOnChanges({content: true, parsers: true} as any);

    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(SelectorHookParser));
    expect((comp as any).activeParsers[0]['config'].component.prototype.constructor.name).toBe('InlineTestComponent');
    expect((comp as any).activeParsers[0]['config'].parseInputs).toBe(false);
  });

  it('#should be able to load parsers in their various forms', () => {
    // Should be able to load parsers that are object literals
    comp.content = 'This is a sentence with a <dynhooks-singletagtest>.';
    comp.parsers = [{component: SingleTagTestComponent, enclosing: false}];
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('SelectorHookParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <dynhooks-singletagtest');
    expect(fixture.nativeElement.children[0].tagName).toBe('DYNHOOKS-SINGLETAGTEST');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should be able to load parsers that are services
    comp.content = 'This is a sentence with a <dynhooks-serviceparsercomponent>.';
    comp.parsers = [ServiceTestParser];
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('ServiceTestParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <dynhooks-singletagtest');
    expect(fixture.nativeElement.children[0].tagName).toBe('DYNHOOKS-SINGLETAGTEST');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should be able to load parsers that are classes
    comp.content = 'This is a sentence with a customhook.';
    comp.parsers = [NonServiceTestParser];
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('NonServiceTestParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <dynhooks-singletagtest');
    expect(fixture.nativeElement.children[0].tagName).toBe('DYNHOOKS-SINGLETAGTEST');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();

    // Should be able to load parsers that are instances
    comp.content = 'This is a sentence with a customhook.';
    comp.parsers = [new NonServiceTestParser()];
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0].constructor.name).toBe('NonServiceTestParser');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.innerHTML).toContain('This is a sentence with a <dynhooks-singletagtest');
    expect(fixture.nativeElement.children[0].tagName).toBe('DYNHOOKS-SINGLETAGTEST');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();


    // Should ignore invalid parser entries
    comp.content = 'This text is irrelevant for this test.';
    comp.parsers = [true as any];
    spyOn(console, 'error').and.callThrough();
    comp.ngOnChanges({content: true, parsers: true} as any);
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
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(0);
    expect((<any> console.error)['calls'].count()).toBe(1);
    expect((<any> console.error)['calls'].mostRecent().args[0]).toBe('Submitted parser does not implement "findHooks()". Removing from list of active parsers:');

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

  it('#should check parser names', () => {
    comp.content = 'This text is irrelevant for this test.';
    comp.parsers = [
      {component: SingleTagTestComponent, name: 'someParser'},
      {component: MultiTagTestComponent, name: 'someParser'}
    ];
    spyOn(console, 'warn').and.callThrough();
    comp.ngOnChanges({content: true, parsers: true} as any);
    expect(comp.activeParsers.length).toBe(2);
    expect((<any> console.warn)['calls'].count()).toBe(1);
    expect((<any> console.warn)['calls'].mostRecent().args[0]).toBe('Parser name "someParser" is not unique and appears multiple times in the list of active parsers.');
  });

  it('#should load fine without parsers', () => {
    ({fixture, comp} = prepareTestingModule([]));

    comp.content = 'something';
    comp.ngOnChanges({content: true} as any);

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
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true} as any);

    // Expect that no component is filtered
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.inline-component')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(3);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[3].componentRef!.instance.constructor.name).toBe('InlineTestComponent');

    // Blacklist: Expect that MultiTagComponentParser is not loaded
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.globalParsersBlacklist = ['MultiTagTestComponentParser'];
    (comp as any).globalParsersWhitelist = null;
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true} as any);

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.inline-component')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('InlineTestComponent');

    // WhiteList: Expect that only InlineTestComponentParser is loaded
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    (comp as any).globalParsersBlacklist = null;
    comp.globalParsersWhitelist = ['InlineTestComponentParser'];
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true} as any);

    expect(fixture.nativeElement.querySelector('.singletag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.inline-component')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('InlineTestComponent');

    // Both: Expect that only SingleTagTestComponentParser is loaded
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.globalParsersBlacklist = ['MultiTagTestComponentParser'];
    comp.globalParsersWhitelist = ['SingleTagTestComponentParser', 'MultiTagTestComponentParser'];
    comp.ngOnChanges({content: true, globalParserBlacklist: true, globalParserWhitelist: true} as any);

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('.inline-component')).toBeNull();
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
    comp.ngOnChanges({content: true, parsers: true} as any);

    expect(comp.activeParsers.length).toBe(1);
    expect((<any>console.error)['calls'].mostRecent().args[0]).toContain('When lazy-loading a component, the "importPromise"-field must contain a function returning the import-promise, but it contained the promise itself.');
  });

  it('#should warn if using lazy-loaded parsers with old Angular versions', () => {
    // Load app first
    comp.content = 'Should load here: <someSelector></someSelector>';
    spyOn(console, 'warn');
    comp.ngOnChanges({content: true} as any);

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
    comp.ngOnChanges({parsers: true} as any);

    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('It seems you are trying to use lazy-loaded-components with an Angular version older than 9. Please note that this functionality requires the new Ivy renderer to be enabled.');
  });

  it('#should resubscribe to outputs if outputs returned by parser changed', () => {
    const testText = `<dynhooks-singletagtest (httpResponseReceived)="content.maneuvers.getMentalState()">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    spyOn(comp.hookIndex[1].componentRef!.instance['httpResponseReceived'], 'subscribe').and.callThrough();

    // Change returned output
    spyOn(comp.activeParsers[0], 'getBindings').and.returnValue({
      outputs: {
        httpResponseReceived: () => 'someotherfunction'
      }
    });

    // Trigger cd
    comp.ngDoCheck();

    // Should have resubscribed
    expect(comp.hookIndex[1].componentRef!.instance['httpResponseReceived'].subscribe['calls'].count()).toBe(1);
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
    expect((hooksReplacer['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('A hook with the same position as another hook was found. There may be multiple identical parsers active that are looking for the same hook. Ignoring duplicates.');

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
    expect((hooksReplacer['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions: Hook opening tag starts before previous hook opening tag ends. Ignoring.');

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
    expect((hooksReplacer['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions: Opening tag of hook overlaps with closing tag of previous hook. Ignoring.');

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
    expect((hooksReplacer['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions: Closing tag of hook overlaps with closing tag of previous hook. Ignoring.');

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
    expect((hooksReplacer['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions: The closing tag of a nested hook lies beyond the closing tag of the outer hook. Ignoring.');
  });
});
