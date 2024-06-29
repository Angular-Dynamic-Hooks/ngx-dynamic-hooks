import { Component, EnvironmentInjector, Injector, NgModule, createEnvironmentInjector } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

// Testing api resources
import { DynamicHooksComponent, ElementSelectorHookParser, ParserEntryResolver, SelectorHookParserConfig, StringSelectorHookParser, provideDynamicHooks } from '../../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule } from '../shared';
import { MultiTagTestComponent } from '../../resources/components/multiTagTest/multiTagTest.c';
import { GENERICINJECTIONTOKEN } from '../../resources/services/genericInjectionToken';
import { SingleTagTestComponent } from '../../resources/components/singleTag/singleTagTest.c';

describe('SelectorHookParserConfig', () => {
  let testBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should throw errors on invalid parser configs', () => {
    // In general, should not include parsers with invalid configs
    spyOn(console, 'error').and.callThrough();
    comp.parsers = [{
      component: SingleTagTestComponent,
      selector: true
    } as any];
    comp.ngOnChanges({content: true, context: true} as any);

    expect(comp.activeParsers.length).toBe(0);
    expect((<any>console.error)['calls'].count()).toBe(1);

    // Get instance of SelectorHookParserConfigResolver for faster, more detailed tests
    const configResolver = TestBed.inject(ParserEntryResolver)['parserResolver'];

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

    // Wrong hostElementTag type
    config = { component: SingleTagTestComponent, hostElementTag: true };
    expect(() => configResolver.processConfig(config as any))
      .toThrow(new Error('The submitted "hostElementTag" property in the SelectorHookParserConfig must be of type string, was boolean'));

    // Wrong enclosing type
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

  it('#should load either String or Element selectorHookParser depending on the config', () => {
    const parserEntryResolver = TestBed.inject(ParserEntryResolver);
    const spy = spyOn((parserEntryResolver as any), 'createSelectorHookParser').and.callThrough();

    const getParserFor = (config: SelectorHookParserConfig) => {
      comp.content = '';
      comp.parsers = [config]
      comp.ngOnChanges({content: true, parsers: true} as any);

      return spy.calls.mostRecent().returnValue.constructor;
    }
    const c = {component: MultiTagTestComponent};

    expect(getParserFor({...c, name: 'asd'})).toBe(ElementSelectorHookParser);
    expect(getParserFor({...c, selector: 'asd'})).toBe(ElementSelectorHookParser);
    expect(getParserFor({...c, hostElementTag: 'asd'})).toBe(ElementSelectorHookParser);
    expect(getParserFor({...c, injector: TestBed.inject(Injector)})).toBe(ElementSelectorHookParser);
    expect(getParserFor({...c, environmentInjector: TestBed.inject(EnvironmentInjector)})).toBe(ElementSelectorHookParser);
    expect(getParserFor({...c, enclosing: false})).toBe(StringSelectorHookParser);
    expect(getParserFor({...c, bracketStyle: {opening: '[', closing: ']'}})).toBe(StringSelectorHookParser);
    expect(getParserFor({...c, parseInputs: false})).toBe(ElementSelectorHookParser);
    expect(getParserFor({...c, unescapeStrings: false})).toBe(ElementSelectorHookParser);
    expect(getParserFor({...c, inputsBlacklist: []})).toBe(ElementSelectorHookParser);
    expect(getParserFor({...c, inputsWhitelist: []})).toBe(ElementSelectorHookParser);
    expect(getParserFor({...c, outputsBlacklist: []})).toBe(ElementSelectorHookParser);
    expect(getParserFor({...c, outputsWhitelist: []})).toBe(ElementSelectorHookParser);
    expect(getParserFor({...c, allowContextInBindings: false})).toBe(ElementSelectorHookParser);
    expect(getParserFor({...c, allowContextFunctionCalls: false})).toBe(ElementSelectorHookParser);
  });

  it('#should recognize and be able to load a variety of selectors', () => {
    const resetWithSelector = (selector: string) => {
      ({fixture, comp} = prepareTestingModule(() => [
        provideDynamicHooks({
          parsers: [{
            component: MultiTagTestComponent,
            selector: selector
          }]
        })
      ]));
    }

    resetWithSelector('a-custom-tag');
    let testText = `<a-custom-tag [someInput]="true"></a-custom-tag>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);

    resetWithSelector('div.my-custom-class');
    testText = `<div class="my-custom-class" [someInput]="true"></div>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    
    resetWithSelector('span[someAttr="cool"]:nth-child(odd)');
    testText = `<div>
      <span someAttr="cool">First span</span>
      <span someAttr="cool">Second span</span>
      <span someAttr="cool">Third span</span>
      <span someAttr="cool">Fourth span</span>
    </div>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    
    expect(fixture.nativeElement.querySelector('div span:nth-child(1)').querySelector('.multitag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('div span:nth-child(1)').textContent).toContain('First span');
    expect(fixture.nativeElement.querySelector('div span:nth-child(2)').querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('div span:nth-child(2)').textContent).toContain('Second span');
    expect(fixture.nativeElement.querySelector('div span:nth-child(3)').querySelector('.multitag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('div span:nth-child(3)').textContent).toContain('Third span');
    expect(fixture.nativeElement.querySelector('div span:nth-child(4)').querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('div span:nth-child(4)').textContent).toContain('Fourth span');
    
    expect(Object.values(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.innerText).toBe('First span');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.location.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(comp.hookIndex[2].componentRef!.location.nativeElement.innerText).toBe('Third span');
  });

  it('#should load custom host elements properly', () => {
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [
          {
            component: MultiTagTestComponent,
            hostElementTag: 'some-custom-element',
            bracketStyle: {opening: '[', closing: ']'}
          },
          {
            component: MultiTagTestComponent,
            hostElementTag: 'yet-another-custom-element'
          }
        ]
      })
    ]));

    comp.content = `
      [multitagtest]
        <p>Some irrelevant text</p>
      [/multitagtest]
      <multitagtest>
        <p>yet more text</p>
      </multitag-element>
    `;
    comp.context = {};
    comp.ngOnChanges({content: true} as any);

    expect(Object.keys(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');

    const firstComponentElement = fixture.nativeElement.children[0];
    expect(firstComponentElement.tagName).toBe('SOME-CUSTOM-ELEMENT');
    expect(comp.hookIndex[1].value.element.tagName).toBe('SOME-CUSTOM-ELEMENT');
    expect(firstComponentElement.children[0].classList).toContain('multitag-component');

    const secondComponentElement = fixture.nativeElement.children[1];
    expect(secondComponentElement.tagName).toBe('YET-ANOTHER-CUSTOM-ELEMENT');
    expect(comp.hookIndex[2].value.element.tagName).toBe('YET-ANOTHER-CUSTOM-ELEMENT');
    expect(secondComponentElement.children[0].classList).toContain('multitag-component');
  });

  it('#should recognize custom injectors', fakeAsync(() => {

    // Without custom element injectors, genericInjectionValue should be null
    const testText = `<singletagtest>`;
    const config: SelectorHookParserConfig = {
      component: SingleTagTestComponent,
      enclosing: false,
      injector: undefined,
      environmentInjector: undefined
    };
    
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [config]
      })
    ]));
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    expect(comp.hookIndex[1].componentRef!.instance.genericInjectionValue).toBeNull();

    // With a custom injector, genericInjectionValue should now be found
    config.injector = Injector.create({
      providers: [{provide: GENERICINJECTIONTOKEN, useValue: { name: 'injector test value' } }]
    });

    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    expect(comp.hookIndex[1].componentRef!.instance.genericInjectionValue).toEqual({ name: 'injector test value' });

    // The same should also work with a custom environment injector
    config.injector = undefined;
    config.environmentInjector = createEnvironmentInjector(
      [{provide: GENERICINJECTIONTOKEN, useValue: { name: 'env injector test value' } }],
      TestBed.inject(EnvironmentInjector),
      'MyCustomEnvInjector'
    );

    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    expect(comp.hookIndex[1].componentRef!.instance.genericInjectionValue).toEqual({ name: 'env injector test value' });

    // However, be careful to set a valid parent field on a custom environment injector, 
    // otherwise it will break DI hierarchy and result in an error
    console.log('reset for faulty injector');
    config.injector = undefined;
    config.environmentInjector = Injector.create({
      providers: [{provide: GENERICINJECTIONTOKEN, useValue: { name: 'env injector test value' } }]
    }) as EnvironmentInjector;

    comp.content = testText;

    spyOn(console, 'error');
    try {
      comp.ngOnChanges({content: true} as any);
    } catch (e) {}
    expect((<any>console.error)['calls'].count()).toBe(1);
  }));

  it('#should recognize singletag hooks', () => {
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: MultiTagTestComponent,
          enclosing: false
        }]
      })
    ]));

    const testText = `<p>Here the multitag hook is set to be single tag instead: <multitagtest [simpleArray]="['arial', 'calibri']">text within hook</multitagtest></p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('');
    expect(fixture.nativeElement.children[0].childNodes[0].textContent).toContain('Here the multitag hook is set to be single tag instead:');
    expect(fixture.nativeElement.children[0].childNodes[1].textContent).not.toContain('text within hook');
    expect(fixture.nativeElement.children[0].childNodes[2].textContent).toContain('text within hook');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.instance.simpleArray).toEqual(['arial', 'calibri']);
  });

  it('#should recognize unique bracket styles', () => {
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: MultiTagTestComponent,
          bracketStyle: {opening: '[[', closing: ']]'}
        }]
      })
    ]));

    const testText = `<p>Here is a hook with a unique bracket style: [[multitagtest [simpleArray]="['arial', 'calibri']"]]text within hook[[/multitagtest]]</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('text within hook');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.instance.simpleArray).toEqual(['arial', 'calibri']);
  });

  it('#should refrain from parsing inputs, if requested', () => {
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: MultiTagTestComponent,
          parseInputs: false,
          refreshBindingsOnPushOnly: false
        } as SelectorHookParserConfig]
      })
    ]));

    const testText = `<p>Here is a hook whose input shall not be parsed: <multitagtest [numberProp]="123" [simpleArray]="['arial', {prop: true}]">text within hook</multitagtest></p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('text within hook');
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.instance.numberProp).toEqual('123');                        // <-- Must be string, not number
    expect(comp.hookIndex[1].componentRef!.instance.simpleArray).toEqual("['arial', {prop: true}]");   // <-- Must be string, not array

    // Expect them to still be unparsed after update
    spyOn(comp['componentUpdater'], 'refresh').and.callThrough();
    comp.ngDoCheck();
    expect((comp['componentUpdater'].refresh as any)['calls'].count()).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.instance.numberProp).toEqual('123');
    expect(comp.hookIndex[1].componentRef!.instance.simpleArray).toEqual("['arial', {prop: true}]");
  });

  it('#should unescapeStrings, if requested', () => {
    const testText = `<singletagtest
      [stringPropAlias]="'This is a \\'test\\' string.'"
      [simpleObject]="{someProp: 'His name was O\\'Hara.'}"
      [simpleArray]="[context['maneu\\vers'].defend('O\\'Hara')]"
    >`;

    // Unescape strings
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false,
          unescapeStrings: true
        }]
      })
    ]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;

    expect(loadedComp.stringProp).toBe("This is a 'test' string.");
    expect(loadedComp.simpleObject).toEqual({someProp: "His name was O'Hara."});
    expect(loadedComp.simpleArray).toEqual(["defending O'Hara!"]);

    // Leave strings as they are
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false,
          unescapeStrings: false
        }]
      })
    ]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    expect(loadedComp.stringProp).toBe("This is a \\'test\\' string.");
    expect(loadedComp.simpleObject).toEqual({someProp: "His name was O\\'Hara."});
    expect(loadedComp.simpleArray).toEqual([undefined]); // Won't be able to find variable with \-chars in property name. Should default to undefined.
  });

  it('#should apply input black/whitelists and output black/whitelists', () => {
    const testText = `
      <singletagtest
        [stringPropAlias]="'this is an example string'"
        [numberProp]="917"
        [simpleArray]="[123, true, 'test']"
        (componentClickedAlias)="123"
        (eventTriggeredAlias)="456"
        (genericOutput)="789"
      >
    `;

    // a) Test inputBlacklist
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false,
          inputsBlacklist: ['numberProp']
        }]
      })
    ]));
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;

    expect(loadedComp.stringProp).toBe('this is an example string');
    expect(loadedComp.numberProp).toBeUndefined();
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[1].outputSubscriptions['componentClicked']).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions['eventTriggered']).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions['genericOutput']).toBeDefined();

    // b) Test inputWhitelist
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false,
          inputsWhitelist: ['simpleArray']
        }]
      })
    ]));
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    expect(loadedComp.stringProp).toBeUndefined();
    expect(loadedComp.numberProp).toBeUndefined();
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[1].outputSubscriptions['componentClicked']).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions['eventTriggered']).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions['genericOutput']).toBeDefined();

    // c) Test inputBlacklist + inputWhitelist
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false,
          inputsBlacklist: ['simpleArray'], 
          inputsWhitelist: ['simpleArray', 'numberProp']
        }]
      })
    ]));
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    expect(loadedComp.stringProp).toBeUndefined();
    expect(loadedComp.numberProp).toBe(917);
    expect(loadedComp.simpleArray).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions['componentClicked']).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions['eventTriggered']).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions['genericOutput']).toBeDefined();

    // d) Test outputBlacklist
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false,
          outputsBlacklist: ['eventTriggeredAlias']
        }]
      })
    ]));
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    expect(loadedComp.stringProp).toBe('this is an example string');
    expect(loadedComp.numberProp).toBe(917);
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[1].outputSubscriptions['componentClicked']).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions['eventTriggered']).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions['genericOutput']).toBeDefined();

    // e) Test outputWhitelist
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false,
          outputsWhitelist: ['genericOutput']
        }]
      })
    ]));
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    expect(loadedComp.stringProp).toBe('this is an example string');
    expect(loadedComp.numberProp).toBe(917);
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[1].outputSubscriptions['componentClicked']).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions['eventTriggered']).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions['genericOutput']).toBeDefined();

    // f) Test outputBlacklist + outputWhitelist
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false,
          outputsBlacklist: ['genericOutput'], 
          outputsWhitelist: ['eventTriggeredAlias', 'genericOutput']
        }]
      })
    ]));
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    expect(loadedComp.stringProp).toBe('this is an example string');
    expect(loadedComp.numberProp).toBe(917);
    expect(loadedComp.simpleArray).toEqual([123, true, 'test']);
    expect(comp.hookIndex[1].outputSubscriptions['componentClicked']).toBeUndefined();
    expect(comp.hookIndex[1].outputSubscriptions['eventTriggered']).toBeDefined();
    expect(comp.hookIndex[1].outputSubscriptions['genericOutput']).toBeUndefined();
  });

  it('#should disallow context access, if requested', () => {
    const testText = `<singletagtest [numberProp]="context.order" (genericOutput)="context.maneuvers.meditate()">`;

    // Context access allowed
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false,
          allowContextInBindings: true
        }]
      })
    ]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;
    spyOn(context.maneuvers, 'meditate').and.callThrough();

    expect(loadedComp.numberProp).toBe(66);
    loadedComp.genericOutput.emit(200);
    expect(context.maneuvers.meditate['calls'].count()).toBe(1);

    // Context access not allowed
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false,
          allowContextInBindings: false
        }]
      })
    ]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    expect(loadedComp.numberProp).toBe(undefined);
    loadedComp.genericOutput.emit(300);
    expect(context.maneuvers.meditate['calls'].count()).toBe(1); // Should not have increased from before
  });

  it('#should disallow context function calls, if requested', () => {
    const testText = `<singletagtest [stringPropAlias]="context.maneuvers.defend('the innocent')" (genericOutput)="context.maneuvers.meditate()">`;

    // Context access allowed
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false,
          allowContextInBindings: true
        }]
      })
    ]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    let loadedComp = comp.hookIndex[1].componentRef!.instance;
    spyOn(context.maneuvers, 'meditate').and.callThrough();

    expect(loadedComp.stringProp).toBe('defending the innocent!');
    loadedComp.genericOutput.emit(200);
    expect(context.maneuvers.meditate['calls'].count()).toBe(1);

    // Context access not allowed
    ({fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({
        parsers: [{
          component: SingleTagTestComponent,
          enclosing: false,
          allowContextFunctionCalls: false
        }]
      })
    ]));

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    loadedComp = comp.hookIndex[1].componentRef!.instance;

    expect(loadedComp.stringProp).toBe(undefined);
    loadedComp.genericOutput.emit(200);
    expect(context.maneuvers.meditate['calls'].count()).toBe(1); // Should not have increased from before
  });
});
