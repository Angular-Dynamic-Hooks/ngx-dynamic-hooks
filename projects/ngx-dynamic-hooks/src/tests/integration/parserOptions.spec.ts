// Testing api resources
import { TestBed } from '@angular/core/testing';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { DynamicHooksComponent, Logger, ParseOptions, anchorElementTag, getParseOptionDefaults, provideDynamicHooks } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule, testParsers } from './shared';
import { GenericSingleTagStringParser } from '../resources/parsers/genericSingleTagStringParser';
import { GenericElementParser } from '../resources/parsers/genericElementParser';
import { enableProdMode, isDevMode, PLATFORM_ID } from '@angular/core';
import * as angularCore from "@angular/core";

describe('ParserOptions', () => {
  let testBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should load global options correctly', () => {
    const differentOptions: any = {};
    for (const [key, value] of Object.entries(getParseOptionDefaults())) {
      if (typeof value === 'boolean') { differentOptions[key] = !value; }
      else if (typeof value === 'number') { differentOptions[key] = value * 2; }
      else if (typeof value === 'string') { differentOptions[key] = value; }
      else {  differentOptions[key] = null; }
    }

    let {fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: testParsers,
        options: differentOptions
      })
    ]);

    comp.content = 'something';
    comp.ngOnChanges({content: true} as any);

    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toBe(differentOptions[key]);
    }
  });

  it('#should load local options correctly', () => {
    const differentOptions: any = {};
    for (const [key, value] of Object.entries(getParseOptionDefaults())) {
      if (typeof value === 'boolean') { differentOptions[key] = !value; }
      else if (typeof value === 'number') { differentOptions[key] = value * 2; }
      else if (typeof value === 'string') { differentOptions[key] = value; }
      else {  differentOptions[key] = null; }
    }

    comp.options = differentOptions as ParseOptions;
    comp.ngOnChanges({content: true, options: true} as any);

    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toBe(differentOptions[key]);
    }
  });

  it('#should merge global and local options correctly', () => {
    const defaults = getParseOptionDefaults();
    const globalOptions: ParseOptions = {};
    const localOptions: ParseOptions = {};
    globalOptions.sanitize = !defaults.sanitize;
    localOptions.triggerDOMEvents = !defaults.triggerDOMEvents;

    let {fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: testParsers,
        options: globalOptions
      })
    ]);

    comp.content = 'something';
    comp.options = localOptions;
    comp.ngOnChanges({content: true} as any);

    expect(comp.activeOptions.sanitize).toBe(!defaults.sanitize);
    expect(comp.activeOptions.triggerDOMEvents).toBe(!defaults.triggerDOMEvents);
  });

  it('#should load fine without options', () => {
    let {fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: testParsers
      })
    ]);

    comp.content = 'something';
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.innerHTML.trim()).toBe('something');
    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toEqual((getParseOptionDefaults() as any)[key]);
    }
  });

  it('#should sanitize, if requested', () => {
    const testText = `
    <script>console.log("somescript");</script>
    <p style="color: blue" onclick="return 'someString'">
      Here is a simple component
      [multitag-string]
        <span id="someId">
          [singletag-string]
        </span>
      [/multitag-string]
      <custom-element></custom-element>
    </p>`;
    comp.content = testText;
    comp.options = { sanitize: true };
    comp.ngOnChanges({content: true, options: true} as any);

    // Ensure that content is sanitized
    let pEl = fixture.nativeElement.querySelector('p');
    let spanEl = fixture.nativeElement.querySelector('span');
    let customEl = fixture.nativeElement.querySelector('custom-element');
    expect(fixture.nativeElement.innerHTML).not.toContain('<script>');
    expect(pEl.getAttribute('style')).toBeNull();
    expect(pEl.onclick).toBeNull();
    expect(spanEl.getAttribute('id')).toBeNull();    
    expect(customEl).toBeNull();
    expect(Object.values(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');

    // Reset
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: testParsers
      })
    ]));

    comp.content = testText;
    comp.options = { sanitize: false };
    comp.ngOnChanges({content: true, options: true} as any);

    // Ensure that unsanitized
    pEl = fixture.nativeElement.querySelector('p');
    spanEl = fixture.nativeElement.querySelector('span');
    customEl = fixture.nativeElement.querySelector('custom-element');
    expect(fixture.nativeElement.innerHTML).toContain('<script>console.log("somescript");</script>');
    expect(pEl.getAttribute('style')).toBe('color: blue');
    expect(pEl.onclick()).toBe('someString');
    expect(spanEl.getAttribute('id')).toBe('someId');
    expect(customEl).not.toBeNull();
    expect(Object.values(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
  });

  it('#should convertHTMLEntities, if requested', () => {
    const testText = `
      The following word has encoded b-tags: &lt;b&gt;BOLD&lt;/b&gt;.
      This hook is using html entities as well: &#91;singletag-string-selector [numberProp]=&quot;21&quot; [simpleArray]='[&quot;enrico&quot;,&nbsp;&quot;susanne&quot;]'&#93;
    `;
    comp.content = testText;
    comp.options = { convertHTMLEntities: true, sanitize: false };
    comp.ngOnChanges({content: true, options: true} as any);

    // Ensure that HTML-Entities are replaced
    expect(fixture.nativeElement.querySelector('b')).not.toBeNull();
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.instance.numberProp).toBe(21);
    expect(comp.hookIndex[1].componentRef!.instance.simpleArray).toEqual(['enrico', 'susanne']);

    // Reset
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: testParsers
      })
    ]));

    comp.content = testText;
    comp.options = { convertHTMLEntities: false, sanitize: false };
    comp.ngOnChanges({content: true, options: true} as any);

    // Ensure that HTML-Entities are not replaced
    expect(fixture.nativeElement.innerHTML).toContain('&lt;b&gt;BOLD&lt;/b&gt;');
    expect(Object.keys(comp.hookIndex).length).toBe(0);
  });

  it('#should fixParagraphTags, if requested', () => {
    const testText = `
      <p>Textbox in seperate HTML-tags, with contained HTML:</p>
      <p>[multitag-string]</p>
        <span>This is some text</span>
        <ul>
          <li>menu point 1</li>
          <li>menu point 2</li>
        </ul>
        loose text
      <p>[/multitag-string]</p>
    `;
    comp.content = testText;
    comp.options = { fixParagraphTags: true };
    comp.ngOnChanges({content: true, options: true} as any);

    // Ensure that p-artifacts are removed
    expect(fixture.nativeElement.children.length).toBe(2);
    expect(fixture.nativeElement.children[0].tagName).toBe('P');
    expect(fixture.nativeElement.children[0].textContent).toBe('Textbox in seperate HTML-tags, with contained HTML:');
    expect(fixture.nativeElement.children[1].tagName).toBe(anchorElementTag.toUpperCase());
    expect(fixture.nativeElement.children[1].children.length).toBe(1);
    expect(fixture.nativeElement.children[1].children[0].className).toBe('multitag-component');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');

    // Reset
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: testParsers
      })
    ]));
    comp.content = testText;
    comp.options = { fixParagraphTags: false };
    comp.ngOnChanges({content: true, options: true} as any);

    // Ensure that p-artifacts are not replaced
    // Any number of things can be wrong when letting the browser parse invalid HTML
    // Not trying to make this check too specific.
    expect(fixture.nativeElement.children.length).not.toBe(2);
  });

  it('#should update on push only, if requested', () => {
    const testText = `[singletag-string]`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: true};
    comp.ngOnChanges({content: true, context: true, options: true} as any);
    spyOn<any>(comp['componentUpdater'], 'refresh').and.callThrough();

    // Ensure that hooks are refreshed on context reference change only
    expect((comp['componentUpdater'].refresh as any)['calls'].count()).toBe(0);
    comp.context.order = 99;
    comp.ngDoCheck();
    expect((comp['componentUpdater'].refresh as any)['calls'].count()).toBe(0);
    comp.context = context;
    comp.ngOnChanges({context: true} as any);
    expect((comp['componentUpdater'].refresh as any)['calls'].count()).toBe(1);

    // Reset
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: testParsers
      })
    ]));
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);
    spyOn<any>(comp['componentUpdater'], 'refresh').and.callThrough();

    // Ensure that hooks are refreshed on any change detection run
    expect((comp['componentUpdater'].refresh as any)['calls'].count()).toBe(0);
    comp.context.order = 99;
    comp.ngDoCheck();
    expect((comp['componentUpdater'].refresh as any)['calls'].count()).toBe(1);
  });

  it('#should compareInputsByValue, if requested', () => {
    const configureParser = function () {
      let genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
      genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
        return {
          inputs: {
            simpleObject: {lightsabers: context.$lightSaberCollection}
          }
        }
      }
    }
    configureParser();

    const testText = `[singletag-string]`;

    comp.content = testText;
    comp.context = context;
    comp.options = { compareInputsByValue: true };
    comp.ngOnChanges({content: true, context: true, options: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;
    let simpleObject = loadedComp.simpleObject;
    spyOn<any>(comp['componentUpdater'], 'refresh').and.callThrough();
    spyOn<any>(loadedComp, 'ngOnChanges').and.callThrough();

    // Clone $lightSaberCollection, so it has a difference reference, but the same content
    // Note: Changing a bound context variable so that a ===-comparison returns false with its previous value will cause
    // the SelectorHookParser to reparse the whole binding, thus changing the reference.
    const newContext = {$lightSaberCollection: [...context.$lightSaberCollection]};

    // With compareByValue: Expect ngOnChanges not to trigger and inputs not to be replaced if value stays the same (even if ref changes)
    comp.context = newContext;
    comp.ngOnChanges({context: true} as any);
    expect((comp['componentUpdater'].refresh as any)['calls'].count()).toBe(1);
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(0);
    expect(loadedComp.simpleObject).toBe(simpleObject);                                 // Should NOT have been replaced
    expect(loadedComp.simpleObject.lightsabers).toBe(context.$lightSaberCollection);    // Should NOT have been replaced

    // Reset
    ({testBed, fixture, comp, context} = defaultBeforeEach());
    configureParser();
    
    comp.content = testText;
    comp.context = context;
    comp.options = { compareInputsByValue: false };
    comp.ngOnChanges({content: true, context: true, options: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;
    simpleObject = loadedComp.simpleObject;
    spyOn<any>(comp['componentUpdater'], 'refresh').and.callThrough();
    spyOn<any>(loadedComp, 'ngOnChanges').and.callThrough();

    // Without compareByValue: Expect ngOnChanges to trigger and inputs to be replaced if reference changes
    comp.context = newContext;
    comp.ngOnChanges({context: true} as any);
    expect((comp['componentUpdater'].refresh as any)['calls'].count()).toBe(1);
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

    const changedBindings = componentUpdater.getChangedBindings(testHook as any, 'inputs', getParseOptionDefaults());
    expect(changedBindings['testInput']).not.toBeUndefined();
  });

  it('#should warn if inputs cannot be compared by value', () => {
    const componentUpdater = comp['componentUpdater'];
    spyOn(console, 'warn').and.callThrough();

    let oldResult: any = {result: null, depthReachedCount: 0};
    let newResult: any = {result: null, depthReachedCount: 0};
    componentUpdater.checkDetailedStringifyResultPair('someBinding', 'someComponent', getParseOptionDefaults(), oldResult, newResult);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('Could stringify neither new nor old value for hook binding "someBinding" for component "someComponent" to compare by value. Defaulting to comparison by reference instead.');

    oldResult = {result: null, depthReachedCount: 0};
    newResult = {result: true, depthReachedCount: 0};
    componentUpdater.checkDetailedStringifyResultPair('someBinding', 'someComponent', getParseOptionDefaults(), oldResult, newResult);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('Could not stringify old value for hook binding "someBinding" for component "someComponent" to compare by value. Defaulting to comparison by reference instead.');

    oldResult = {result: true, depthReachedCount: 0};
    newResult = {result: null, depthReachedCount: 0};
    componentUpdater.checkDetailedStringifyResultPair('someBinding', 'someComponent', getParseOptionDefaults(), oldResult, newResult);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('Could not stringify new value for hook binding "someBinding" for component "someComponent" to compare by value. Defaulting to comparison by reference instead.');

    oldResult = {result: true, depthReachedCount: 1};
    newResult = {result: true, depthReachedCount: 1};
    componentUpdater.checkDetailedStringifyResultPair('someBinding', 'someComponent', getParseOptionDefaults(), oldResult, newResult);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toContain('Maximum compareByValueDepth of');

    oldResult = {result: true, depthReachedCount: 0};
    newResult = {result: true, depthReachedCount: 1};
    componentUpdater.checkDetailedStringifyResultPair('someBinding', 'someComponent', getParseOptionDefaults(), oldResult, newResult);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toContain('Maximum compareByValueDepth of');

    oldResult = {result: true, depthReachedCount: 1};
    newResult = {result: true, depthReachedCount: 0};
    componentUpdater.checkDetailedStringifyResultPair('someBinding', 'someComponent', getParseOptionDefaults(), oldResult, newResult);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toContain('Maximum compareByValueDepth of');
  });

  it('#should apply the desired compareByValueDepth', () => {
    const configureParser = function () {
      let genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
      genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
        return {
          inputs: {
            simpleObject: context.someObj
          }
        }
      }
    }
    configureParser();

    const firstContext = {someObj: {firstLevel: {secondLevel: {thirdLevel: {someValue: 5 }}}}};
    const secondContext = {someObj: {firstLevel: {secondLevel: {thirdLevel: {someValue: 10 }}}}};

    const testText = `[singletag-string]`;
    comp.content = testText;
    comp.context = firstContext;
    comp.options = { compareInputsByValue: true, compareByValueDepth: 3 };
    comp.ngOnChanges({content: true, context: true, options: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;
    spyOn<any>(loadedComp, 'ngOnChanges').and.callThrough();

    // Expect ngOnChanges not to trigger if changed value is out of reach
    comp.context = secondContext;
    comp.ngOnChanges({context: true} as any);
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(0);

    // Reset
    ({testBed, fixture, comp, context} = defaultBeforeEach());
    configureParser();
    
    comp.content = testText;
    comp.context = firstContext;
    comp.options = { compareInputsByValue: true, compareByValueDepth: 4 };
    comp.ngOnChanges({content: true, context: true, options: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;
    spyOn<any>(loadedComp, 'ngOnChanges').and.callThrough();

    // Expect ngOnChanges to trigger if changed value is within reach
    comp.context = secondContext;
    comp.ngOnChanges({context: true} as any);
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(1);
  });

  it('should not trigger DOM events by default', () => {
    let eventValue: any = null;

    const testText = `[singletag-string]`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;
    let loadedCompElement: HTMLElement = comp.hookIndex[1].componentRef?.location.nativeElement;

    // Register html event listeners
    loadedCompElement.addEventListener('genericOutput', event => {
      eventValue = (event as CustomEvent).detail;
    });

    // Trigger output
    loadedComp.genericOutput.emit("The payload!");

    // Custom events should not have fired
    expect(eventValue).toBe(null);
  });

  it('should triggerDOMEvents, if requested', () => {
    let eventValue: any = null;

    const testText = `[singletag-string]`;
    comp.content = testText;
    comp.options = { triggerDOMEvents: true }
    comp.ngOnChanges({content: true, options: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;
    let loadedCompElement: HTMLElement = comp.hookIndex[1].componentRef?.location.nativeElement;

    // Register html event listeners
    loadedCompElement.addEventListener('genericOutput', event => {
      eventValue = (event as CustomEvent).detail;
    });

    // Trigger output
    loadedComp.genericOutput.emit("The payload!");

    // Custom events should have fired
    expect(eventValue).toBe("The payload!");
  });

  it('#should ignoreInputAliases, if requested', () => {
    const configureParser = function () {
      let genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
      genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
        return {
          inputs: {
            stringPropAlias: 'Hello there',
            stringProp: 'General Kenobi'
          }
        }
      }
    }
    configureParser();

    const testText = `[singletag-string]`;
    comp.content = testText;
    comp.options = { ignoreInputAliases: true };
    comp.ngOnChanges({content: true, options: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;

    // Expect input property to be set by its property name
    expect(loadedComp.stringProp).toBe('General Kenobi');

    // Reset
    ({testBed, fixture, comp, context} = defaultBeforeEach());
    configureParser();

    comp.content = testText;
    comp.options = { ignoreInputAliases: false };
    comp.ngOnChanges({content: true, options: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    // Expect input property to be set by its alias
    expect(loadedComp.stringProp).toBe('Hello there');
  });

  it('#should ignoreOutputAliases, if requested', () => {
    const configureParser = function () {
      let genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
      genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
        return {
          outputs: {
            eventTriggeredAlias: event => 123,
            componentClicked: event => 456
          }
        }
      }
    }
    configureParser();

    const testText = `[singletag-string]`;
    comp.content = testText;
    comp.options = { ignoreOutputAliases: true };
    comp.ngOnChanges({content: true, options: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;

    // Expect output property to be set by its property name
    expect(comp.hookIndex[1].outputSubscriptions['componentClicked']).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions['eventTriggered']).toBeUndefined();

    // Reset
    ({testBed, fixture, comp, context} = defaultBeforeEach());
    configureParser();

    comp.content = testText;
    comp.options = { ignoreOutputAliases: false };
    comp.ngOnChanges({content: true, options: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    // Expect output property to be set by its alias
    expect(comp.hookIndex[1].outputSubscriptions['componentClicked']).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions['eventTriggered']).toBeDefined();
  });

  it('#should acceptInputsForAnyProperty, if requested', () => {
    const configureParser = function () {
      let genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
      genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
        return {
          inputs: {
            thisPropertyDoesNotExist: 123
          }
        }
      }
    }
    configureParser();

    const testText = `[singletag-string]`;
    comp.content = testText;
    comp.options = { acceptInputsForAnyProperty: true };
    comp.ngOnChanges({content: true, options: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;

    // Expect property to be set regardless of whether or not it is declared as @Input() or not
    expect(loadedComp.thisPropertyDoesNotExist).toBe(123);

    // Reset
    ({testBed, fixture, comp, context} = defaultBeforeEach());
    configureParser();

    comp.content = testText;
    comp.options = { acceptInputsForAnyProperty: false };
    comp.ngOnChanges({content: true, options: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    // Expect property not to be set when not declared as @Input()
    expect(loadedComp.thisPropertyDoesNotExist).toBeUndefined();
  });

  it('#should ignore acceptInputsForAnyProperty if special forbidden property', () => {
    const configureParser = function () {
      let genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
      genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
        return {
          inputs: {
            prototype: false
          }
        }
      }
    }
    configureParser();

    const testText = `[singletag-string]`;
    comp.content = testText;
    comp.context = context;
    comp.options = {acceptInputsForAnyProperty: true};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    const loadedComp: SingleTagTestComponent = comp.hookIndex[1].componentRef!.instance;
    expect(loadedComp as any['prototype']).not.toBe(false);
  });

  it('#should acceptOutputsForAnyObservable, if requested', () => {
    const configureParser = function () {
      let genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
      genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
        return {
          outputs: {
            nonOutputEventEmitter: event => 123
          }
        }
      }
    }
    configureParser();

    const testText = `[singletag-string]`;
    comp.content = testText;
    comp.options = { acceptOutputsForAnyObservable: true };
    comp.ngOnChanges({content: true, options: true} as any);

    // Expect property to be set regardless of whether or not it is declared as @Output() or not
    expect(comp.hookIndex[1].outputSubscriptions['nonOutputEventEmitter']).toBeDefined();

    // Reset
    ({testBed, fixture, comp, context} = defaultBeforeEach());
    configureParser();

    comp.content = testText;
    comp.options = { acceptOutputsForAnyObservable: false };
    comp.ngOnChanges({content: true, options: true} as any);

    // Expect property not to be set when not declared as @Output()
    expect(comp.hookIndex[1].outputSubscriptions['nonOutputEventEmitter']).toBeUndefined();
  });

  it('#should should adhere to the passed logOptions', () => {
    const logger = TestBed.inject(Logger);
    const logSpy = spyOn(console, 'log').and.callThrough();
    const warnSpy = spyOn(console, 'warn').and.callThrough();
    const errorSpy = spyOn(console, 'error').and.callThrough();

    const testText = `[singletag-string-selector [genericInput]="context.asd"]`

    // By default, should log in dev
    comp.content = testText;
    comp.options = { sanitize: false };
    comp.ngOnChanges({content: true, options: true} as any);
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(warnSpy.calls.all().length).toBe(1);

    // Should not log in prod by default
    const isDevModeSpy = spyOn(logger as any, 'isDevMode').and.returnValue(false);
    comp.options = { sanitize: false }
    comp.ngOnChanges({content: true, options: true} as any);
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(warnSpy.calls.all().length).toBe(1);

    // Should work after setting prod to true
    comp.options = { sanitize: false, logOptions: {prod: true} }
    comp.ngOnChanges({content: true, options: true} as any);
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(warnSpy.calls.all().length).toBe(2);
    isDevModeSpy.and.callThrough();

    // Should not log during SSR by default
    const { comp: ssrComp } = prepareTestingModule(() => [
      provideDynamicHooks({parsers: testParsers}),
      {provide: PLATFORM_ID, useValue: 'server'}
    ]);
    ssrComp.content = testText;
    ssrComp.options = {sanitize: false}
    ssrComp.ngOnChanges({content: true, options: true} as any);
    expect(Object.keys(ssrComp.hookIndex).length).toBe(1);
    expect(warnSpy.calls.all().length).toBe(2);

    // Should work after setting ssr to true
    ssrComp.options = { sanitize: false, logOptions: {ssr: true} }
    ssrComp.ngOnChanges({content: true, options: true} as any);
    expect(Object.keys(ssrComp.hookIndex).length).toBe(1);
    expect(warnSpy.calls.all().length).toBe(3);
  });
 
});

