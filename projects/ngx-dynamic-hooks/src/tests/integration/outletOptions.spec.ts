// Testing api resources
import { OutletOptions, outletOptionDefaults } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule, testParsers } from './shared';
import { OutletComponentWithProviders } from '../resources/components/OutletComponentWithProviders';

describe('OutletOptions', () => {
  let testBed;
  let fixture: any;
  let comp: OutletComponentWithProviders;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

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
    comp.ngOnChanges({content: true} as any);

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
    comp.ngOnChanges({content: true, options: true} as any);

    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toBe(differentOptions[key]);
    }
  });

  it('#should ignore invalid options', () => {
    const invalidOptions = {
      invalidOption: true
    };

    comp.options = invalidOptions as OutletOptions;
    comp.ngOnChanges({content: true, options: true} as any);

    for (const [key, value] of Object.entries(comp.activeOptions)) {
      expect(value).toBe((outletOptionDefaults as any)[key]);
    }
  });

  it('#should load fine without options', () => {
    ({fixture, comp} = prepareTestingModule(testParsers, []));

    comp.content = 'something';
    comp.ngOnChanges({content: true} as any);

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
    comp.ngOnChanges({content: true, options: true} as any);

    // Ensure that sanitized
    expect(fixture.nativeElement.innerHTML).not.toContain('<script>');
    let pEl = fixture.nativeElement.querySelector('p');
    expect(pEl.getAttribute('id')).toBeNull();
    expect(pEl.getAttribute('style')).toBeNull();
    expect(pEl.onclick).toBeNull();
    let customEl = fixture.nativeElement.querySelector('custom-element');
    expect(customEl).toBeNull();
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.instance.simpleObject).toEqual({testProp: 123, otherProp: true});

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { sanitize: false };
    comp.ngOnChanges({content: true, options: true} as any);

    // Ensure that unsanitized
    expect(fixture.nativeElement.innerHTML).toContain('<script>console.log("somescript");</script>');
    pEl = fixture.nativeElement.querySelector('p');
    expect(pEl.getAttribute('id')).toBe('someId');
    expect(pEl.getAttribute('style')).toBe('color: blue');
    expect(pEl.onclick()).toBe('someString');
    customEl = fixture.nativeElement.querySelector('custom-element');
    expect(customEl).not.toBeNull();
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.instance.simpleObject).toEqual({testProp: 123, otherProp: true});
  });

  it('#should convertHTMLEntities, if requested', () => {
    const testText = `
      The following word has encoded b-tags: &lt;b&gt;BOLD&lt;/b&gt;.
      This hook is using html entities as well: &lt;dynhooks-singletagtest [numberProp]=&quot;21&quot; [simpleArray]='[&quot;enrico&quot;,&nbsp;&quot;susanne&quot;]'&gt;
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
    ({fixture, comp} = prepareTestingModule(testParsers));
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
    comp.ngOnChanges({content: true, options: true} as any);

    // Ensure that p-artifacts are removed
    expect(fixture.nativeElement.children.length).toBe(2);
    expect(fixture.nativeElement.children[0].tagName).toBe('P');
    expect(fixture.nativeElement.children[0].textContent).toBe('Textbox in seperate HTML-tags, with contained HTML:');
    expect(fixture.nativeElement.children[1].tagName).toBe('DYNHOOKS-MULTITAGTEST');
    expect(fixture.nativeElement.children[1].children.length).toBe(1);
    expect(fixture.nativeElement.children[1].children[0].className).toBe('multitag-component');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { fixParagraphTags: false };
    comp.ngOnChanges({content: true, options: true} as any);

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
    ({fixture, comp} = prepareTestingModule(testParsers));
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
    // Clone $lightSaberCollection, so it has a difference reference, but the same content
    // Note: Changing a bound context variable so that a ===-comparison returns false with its previous value will cause
    // the SelectorHookParser to reparse the whole binding, thus changing the reference.
    const newContext = {$lightSaberCollection: [...context.$lightSaberCollection]};
    const testText = `<dynhooks-singletagtest [simpleObject]="{lightsabers: context.$lightSaberCollection}">`;

    comp.content = testText;
    comp.context = context;
    comp.options = { compareInputsByValue: true };
    comp.ngOnChanges({content: true, context: true, options: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;
    let simpleObject = loadedComp.simpleObject;
    spyOn<any>(comp['componentUpdater'], 'refresh').and.callThrough();
    spyOn<any>(loadedComp, 'ngOnChanges').and.callThrough();

    // With compareByValue: Expect ngOnChanges not to trigger and inputs not to be replaced if value stays the same (even if ref changes)
    comp.context = newContext;
    comp.ngOnChanges({context: true} as any);
    expect((comp['componentUpdater'].refresh as any)['calls'].count()).toBe(1);
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(0);
    expect(loadedComp.simpleObject).toBe(simpleObject);                                 // Should NOT have been replaced
    expect(loadedComp.simpleObject.lightsabers).toBe(context.$lightSaberCollection);    // Should NOT have been replaced

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
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

    const changedBindings = componentUpdater.getChangedBindings(testHook as any, 'inputs', true, 5);
    expect(changedBindings['testInput']).not.toBeUndefined();
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
    comp.ngOnChanges({content: true, context: true, options: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;
    spyOn<any>(loadedComp, 'ngOnChanges').and.callThrough();

    // Expect ngOnChanges not to trigger if changed value is out of reach
    comp.context = secondContext;
    comp.ngOnChanges({context: true} as any);
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(0);

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
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

  it('#should ignoreInputAliases, if requested', () => {
    const testText = `<dynhooks-singletagtest [stringPropAlias]="'Hello there'" [stringProp]="'General Kenobi'">`;
    comp.content = testText;
    comp.options = { ignoreInputAliases: true };
    comp.ngOnChanges({content: true, options: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;

    // Expect input property to be set by its property name
    expect(loadedComp.stringProp).toBe('General Kenobi');

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { ignoreInputAliases: false };
    comp.ngOnChanges({content: true, options: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    // Expect input property to be set by its alias
    expect(loadedComp.stringProp).toBe('Hello there');
  });

  it('#should ignoreOutputAliases, if requested', () => {
    const testText = `<dynhooks-singletagtest (eventTriggeredAlias)="123" (componentClicked)="456">`;
    comp.content = testText;
    comp.options = { ignoreOutputAliases: true };
    comp.ngOnChanges({content: true, options: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;

    // Expect output property to be set by its property name
    expect(comp.hookIndex[1].outputSubscriptions['componentClicked']).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions['eventTriggered']).toBeUndefined();

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { ignoreOutputAliases: false };
    comp.ngOnChanges({content: true, options: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    // Expect output property to be set by its alias
    expect(comp.hookIndex[1].outputSubscriptions['componentClicked']).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions['eventTriggered']).toBeDefined();
  });

  it('#should acceptInputsForAnyProperty, if requested', () => {
    const testText = `<dynhooks-singletagtest [thisPropertyDoesNotExist]="123">`;
    comp.content = testText;
    comp.options = { acceptInputsForAnyProperty: true };
    comp.ngOnChanges({content: true, options: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;

    // Expect property to be set regardless of whether or not it is declared as @Input() or not
    expect(loadedComp.thisPropertyDoesNotExist).toBe(123);

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { acceptInputsForAnyProperty: false };
    comp.ngOnChanges({content: true, options: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    // Expect property not to be set when not declared as @Input()
    expect(loadedComp.thisPropertyDoesNotExist).toBeUndefined();
  });

  it('#should acceptOutputsForAnyObservable, if requested', () => {
    const testText = `<dynhooks-singletagtest (nonOutputEventEmitter)="123">`;
    comp.content = testText;
    comp.options = { acceptOutputsForAnyObservable: true };
    comp.ngOnChanges({content: true, options: true} as any);

    // Expect property to be set regardless of whether or not it is declared as @Output() or not
    expect(comp.hookIndex[1].outputSubscriptions['nonOutputEventEmitter']).toBeDefined();

    // Reset
    ({fixture, comp} = prepareTestingModule(testParsers));
    comp.content = testText;
    comp.options = { acceptOutputsForAnyObservable: false };
    comp.ngOnChanges({content: true, options: true} as any);

    // Expect property not to be set when not declared as @Output()
    expect(comp.hookIndex[1].outputSubscriptions['nonOutputEventEmitter']).toBeUndefined();
  });
 
});

