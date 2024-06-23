import { PLATFORM_ID } from '@angular/core';
import { ComponentFixtureAutoDetect, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { first } from 'rxjs/operators';

// Testing api resources
import { DynamicHooksComponent, LoadedComponent, anchorAttrHookId, anchorAttrParseToken, anchorElementTag, provideDynamicHooks } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule, testParsers } from './shared';
import { ParentTestComponent } from '../resources/components/parentTest/parentTest.c';
import { LazyTestComponent } from '../resources/components/lazyTest/lazyTest.c';
import { GenericMultiTagStringParser } from '../resources/parsers/genericMultiTagStringParser';
import { GenericSingleTagStringParser } from '../resources/parsers/genericSingleTagStringParser';
import { GenericWhateverStringParser } from '../resources/parsers/genericWhateverStringParser';
import { ModuleTestComponent } from '../resources/components/moduleTest/moduleTest.c';
import { GenericMultiTagElementParser } from '../resources/parsers/genericMultiTagElementParser';
import { NgContentTestComponent } from '../resources/components/ngContentTest/ngContentTest.c';

describe('Component loading', () => {
  let testBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should load just the text if there are no dynamic components', () => {
    const testText = `
    <div>
      <p>This is a bit of prose. If has no dynamic components in it.</p>
      <p>Hopefully, this does not cause the app to explode.</p>
    </div>
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.innerHTML.trim()).toBe(testText.trim());
    expect(Object.values(comp.hookIndex).length).toBe(0);
  });

  it('#should ensure the passed componentConfig is correct', () => {
    // Load with nonsensical componentConfig
    expect(() => comp['dynamicHooksService']['componentCreator'].loadComponentClass(true as any))
      .toThrow(new Error('The "component" property of a returned HookData object must either contain the component class or a LazyLoadComponentConfig'));
  });

  it('#should be able to load module components', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [ModuleTestComponent],
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
        provideDynamicHooks({parsers: [GenericWhateverStringParser]})
      ]
    });

    const genericWhateverParser = TestBed.inject(GenericWhateverStringParser);
    genericWhateverParser.component = ModuleTestComponent;
  
    const fixture = TestBed.createComponent(DynamicHooksComponent);
    const comp = fixture.componentInstance;
    comp.content = '[whatever-string][/whatever-string]';
    comp.ngOnChanges({content: true} as any);

    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef?.instance.constructor.name).toBe('ModuleTestComponent');
    expect(fixture.nativeElement.querySelector('.module-component')).not.toBe(null);
  });

  it('#should be able to load standalone components', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
        provideDynamicHooks({parsers: [GenericSingleTagStringParser]})
      ]
    });
  
    const fixture = TestBed.createComponent(DynamicHooksComponent);
    const comp = fixture.componentInstance;
    comp.content = '[singletag-string][/singletag-string]';
    comp.ngOnChanges({content: true} as any);

    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef?.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
  });

  it('#should remove components if they fail to load', () => {
    const genericMultiTagParser = TestBed.inject(GenericMultiTagStringParser);
    (genericMultiTagParser.onGetBindings as any) = () => {
      throw new Error('Failed to load bindings for example');
    }

    const testText = `[multitag-string]This is the inner content.[/multitag-string]`;
    comp.content = testText;
    spyOn(console, 'error');
    comp.ngOnChanges({content: true} as any);

    expect(Object.values(comp.hookIndex).length).toBe(0);
    expect((<any>console.error)['calls'].count()).toBe(1);
  });

  it('#should load child view components normally', () => {
    const genericMultiTagParser = TestBed.inject(GenericMultiTagStringParser);
    genericMultiTagParser.component = ParentTestComponent;

    const testText = `<p>Here's a normal parent component, which should contain its child component as declared in the template: [multitag-string][/multitag-string]</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    // Check that parent component has loaded correctly
    const parentComponent = comp.hookIndex[1].componentRef!.instance;
    expect(fixture.nativeElement.querySelector('.parenttest-component')).not.toBe(null); // Component has loaded
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(parentComponent.constructor.name).toBe('ParentTestComponent');
    expect(parentComponent.blubbService).toEqual({name: 'blubb'});

    // Check that child component has loaded correctly
    const childComponent = parentComponent.childTestComponent;
    expect(fixture.nativeElement.querySelector('.childtest-component')).not.toBe(null); // Component has loaded
    expect(childComponent.constructor.name).toBe('ChildTestComponent');
    expect(childComponent.blubbService).toBe(parentComponent.blubbService);
  });

  it('#should load custom ng-content properly', () => {
    const genericMultiTagParser = TestBed.inject(GenericMultiTagElementParser);
    genericMultiTagParser.onLoadComponent = (hookId, hookValue, context, childNodes) => {
      const customSpan = document.createElement('span');
      customSpan.innerHTML = 'this should be highlighted';
  
      const customH2 = document.createElement('h2');
      customH2.innerHTML = 'This is the title';
  
      const customDiv = document.createElement('div');
      customDiv.innerHTML = 'Some random content';
  
      const content = [];
      content[0] = [customSpan];
      content[2] = [customH2, customDiv];
  
      return {
        component: NgContentTestComponent,
        injector: undefined,
        content: content
      };
    }

    const testText = `
      <multitag-element>
        <p>original content</p>
        [singletag-string]
      </multitag-element>
    `;
    comp.content = testText;
    comp.context = {};
    comp.ngOnChanges({content: true, context: context} as any);

    // Inner component should not be loaded
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('NgContentTestComponent');

    // Make sure that <ng-content> slots of NgContentComponent are correctly filled out
    const componentElement = fixture.nativeElement.children[0];
    const firstContentContainer = componentElement.children[0].children[0].children[1];
    const secondContentContainer = componentElement.children[0].children[1].children[1];
    const thirdContentContainer = componentElement.children[0].children[2].children[1];

    expect(firstContentContainer.innerHTML.trim()).toBe('<span>this should be highlighted</span>');                    // Should replace normal child nodes
    expect(secondContentContainer.innerHTML.trim()).toBe('');                                                          // Intentionally skipped this ngContent-index
    expect(thirdContentContainer.innerHTML.trim()).toBe('<h2>This is the title</h2><div>Some random content</div>');   // Should have two elements
  });

  it('#should trigger ngOnInit() after component creation', () => {
    const testText = `Just some component: [singletag-string]`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    const loadedComp = comp.hookIndex[1].componentRef!.instance;
    expect(loadedComp.ngOnInitTriggered).toBe(true);
  });

  it('#should correctly trigger onDynamicMount() on init', () => {
    const testText = `
    [multitag-string]
      bla bla
      [singletag-string]
      <p>some<b>text</b></p>
      <div>
        [multitag-string]
          [singletag-string]
          [multitag-string]
            [multitag-string]
              [whatever-string][/whatever-string]
            [/multitag-string]
            [singletag-string]
          [/multitag-string]
          yada yada
          <ul>
            <li>first li</li>
            <li>second li with [whatever-string][/whatever-string]</li>
            <li>third li</li>
          </ul>
        [/multitag-string]
      </div>
    [/multitag-string]`;

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, parsers: true, context: true} as any);

    // Denoting level of nestedness with number prefix here
    const one_multiTagComp = comp.hookIndex[1].componentRef!.instance;
    const two_singleTagComp = comp.hookIndex[2].componentRef!.instance;
    const two_multiTagComp = comp.hookIndex[3].componentRef!.instance;
    const three_singleTagComp = comp.hookIndex[4].componentRef!.instance;
    const three_customComp = comp.hookIndex[5].componentRef!.instance;
    const four_customComp = comp.hookIndex[6].componentRef!.instance;
    const four_singleTagComp = comp.hookIndex[7].componentRef!.instance;
    const five_whateverComp = comp.hookIndex[8].componentRef!.instance;
    const three_whateverComp = comp.hookIndex[9].componentRef!.instance;

    // Context should have been passed in
    expect(one_multiTagComp.mountContext).toEqual(context);
    expect(two_singleTagComp.mountContext).toEqual(context);
    expect(two_multiTagComp.mountContext).toEqual(context);
    expect(three_singleTagComp.mountContext).toEqual(context);
    expect(three_customComp.mountContext).toEqual(context);
    expect(four_customComp.mountContext).toEqual(context);
    expect(four_singleTagComp.mountContext).toEqual(context);
    expect(five_whateverComp.mountContext).toEqual(context);
    expect(three_whateverComp.mountContext).toEqual(context);

    // Content children should have been generated and passed into all loaded components
    // Test each individually (all the way down)
    expect(one_multiTagComp.mountContentChildren.length).toBe(2);
    expect(one_multiTagComp.mountContentChildren[0].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[0].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(one_multiTagComp.mountContentChildren[0].hookValue).toEqual({openingTag: '[singletag-string]', closingTag: null, element: null});
    expect(one_multiTagComp.mountContentChildren[0].contentChildren.length).toBe(0);
    expect(one_multiTagComp.mountContentChildren[1].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(one_multiTagComp.mountContentChildren[1].hookValue).toEqual({openingTag: '[multitag-string]', closingTag: '[/multitag-string]', element: null});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren.length).toBe(3);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[0].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[0].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[0].hookValue).toEqual({openingTag: '[singletag-string]', closingTag: null, element: null});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren.length).toBe(0);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].hookValue).toEqual({openingTag: '[multitag-string]', closingTag: '[/multitag-string]', element: null});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren.length).toBe(2);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].hookValue).toEqual({openingTag: '[multitag-string]', closingTag: '[/multitag-string]', element: null});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren.length).toBe(1);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren[0].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren[0].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren[0].hookValue).toEqual({openingTag: '[whatever-string]', closingTag: '[/whatever-string]', element: null});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren[0].contentChildren.length).toBe(0);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[1].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[1].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[1].hookValue).toEqual({openingTag: '[singletag-string]', closingTag: null, element: null});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[1].contentChildren.length).toBe(0);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[2].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[2].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[2].hookValue).toEqual({openingTag: '[whatever-string]', closingTag: '[/whatever-string]', element: null});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[2].contentChildren.length).toBe(0);

    expect(two_singleTagComp.mountContentChildren.length).toBe(0);

    expect(two_multiTagComp.mountContentChildren.length).toBe(3);
    expect(two_multiTagComp.mountContentChildren[0].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(two_multiTagComp.mountContentChildren[0].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[0].hookValue).toEqual({openingTag: '[singletag-string]', closingTag: null, element: null});
    expect(two_multiTagComp.mountContentChildren[0].contentChildren.length).toBe(0);
    expect(two_multiTagComp.mountContentChildren[1].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(two_multiTagComp.mountContentChildren[1].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[1].hookValue).toEqual({openingTag: '[multitag-string]', closingTag: '[/multitag-string]', element: null});
    expect(two_multiTagComp.mountContentChildren[1].contentChildren.length).toBe(2);
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].hookValue).toEqual({openingTag: '[multitag-string]', closingTag: '[/multitag-string]', element: null});
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren.length).toBe(1);
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren[0].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren[0].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren[0].hookValue).toEqual({openingTag: '[whatever-string]', closingTag: '[/whatever-string]', element: null});
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren[0].contentChildren.length).toBe(0);
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[1].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[1].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[1].hookValue).toEqual({openingTag: '[singletag-string]', closingTag: null, element: null});
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren.length).toBe(0);
    expect(two_multiTagComp.mountContentChildren[2].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(two_multiTagComp.mountContentChildren[2].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[2].hookValue).toEqual({openingTag: '[whatever-string]', closingTag: '[/whatever-string]', element: null});
    expect(two_multiTagComp.mountContentChildren[2].contentChildren.length).toBe(0);

    expect(three_singleTagComp.mountContentChildren.length).toBe(0);

    expect(three_customComp.mountContentChildren.length).toBe(2);
    expect(three_customComp.mountContentChildren[0].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(three_customComp.mountContentChildren[0].componentRef).toBeDefined();
    expect(three_customComp.mountContentChildren[0].hookValue).toEqual({openingTag: '[multitag-string]', closingTag: '[/multitag-string]', element: null});
    expect(three_customComp.mountContentChildren[0].contentChildren.length).toBe(1);
    expect(three_customComp.mountContentChildren[0].contentChildren[0].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(three_customComp.mountContentChildren[0].contentChildren[0].componentRef).toBeDefined();
    expect(three_customComp.mountContentChildren[0].contentChildren[0].hookValue).toEqual({openingTag: '[whatever-string]', closingTag: '[/whatever-string]', element: null});
    expect(three_customComp.mountContentChildren[0].contentChildren[0].contentChildren.length).toBe(0);
    expect(three_customComp.mountContentChildren[1].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(three_customComp.mountContentChildren[1].componentRef).toBeDefined();
    expect(three_customComp.mountContentChildren[1].hookValue).toEqual({openingTag: '[singletag-string]', closingTag: null, element: null});
    expect(three_customComp.mountContentChildren[1].contentChildren.length).toBe(0);

    expect(four_customComp.mountContentChildren.length).toBe(1);
    expect(four_customComp.mountContentChildren[0].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(four_customComp.mountContentChildren[0].componentRef).toBeDefined();
    expect(four_customComp.mountContentChildren[0].hookValue).toEqual({openingTag: '[whatever-string]', closingTag: '[/whatever-string]', element: null});
    expect(four_customComp.mountContentChildren[0].contentChildren.length).toBe(0);

    expect(four_singleTagComp.mountContentChildren.length).toBe(0);

    expect(five_whateverComp.mountContentChildren.length).toBe(0);

    expect(three_whateverComp.mountContentChildren.length).toBe(0);
  });

  it('#should correctly trigger onDynamicChanges() on context reference change', () => {
    const testText = `[singletag-string]`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    const loadedComp = comp.hookIndex[1].componentRef!.instance;
    spyOn(loadedComp, 'onDynamicChanges').and.callThrough();
    spyOn(comp['componentUpdater'], 'refresh').and.callThrough();

    // Should be set from initial call
    expect(loadedComp.changesContext).toEqual(context);

    // Shouldn't be called again when context property changes...
    comp.context.order = 77;
    comp.ngDoCheck();
    expect((comp['componentUpdater'].refresh as any)['calls'].count()).toBe(1);
    expect(loadedComp.onDynamicChanges['calls'].count()).toBe(0);

    // ...only when context object changes by reference
    const newContext = {newProps: [1, 2, 3, 'something']};
    comp.context = newContext;
    comp.ngOnChanges({context: true} as any);
    expect((comp['componentUpdater'].refresh as any)['calls'].count()).toBe(2);
    expect(loadedComp.onDynamicChanges['calls'].count()).toBe(1);
    expect(loadedComp.changesContext).toEqual(newContext);
  });

  it('#should activate change detection for dynamically loaded components', () => {
    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          numberProp: context.order
        }
      }
    }

    const testText = `[singletag-string]`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

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
      This is the first component. It uses constructor injection: [singletag-string].
      This is the second component. It uses the inject() function: [multitag-string][/multitag-string].
    </p>
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(Object.keys(comp.hookIndex).length).toEqual(2);
    const firstComp = comp.hookIndex[1].componentRef!.instance;
    const secondComp = comp.hookIndex[2].componentRef!.instance;

    // Should be loaded in both
    expect(firstComp['cd']).not.toBeFalsy();
    expect(secondComp['cd']).not.toBeFalsy();
    expect(firstComp['rootTestService']['someString']).toBe('RootTestService works!');
    expect(secondComp['rootTestService']['someString']).toBe('RootTestService works!');

    // Change value in service
    firstComp['rootTestService']['someString'] = 'Value has changed!';

    // Should be reflected in both
    expect(firstComp['rootTestService']['someString']).toBe('Value has changed!');
    expect(secondComp['rootTestService']['someString']).toBe('Value has changed!');
  });

  it('#should trigger componentsLoaded when all components have loaded', () => {
    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          stringPropAlias: 'some random sentence'
        }
      }
    }

    const genericMultiTagParser = TestBed.inject(GenericMultiTagStringParser);
    genericMultiTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          nr: 99
        }
      }
    }

    const genericWhateverParser = TestBed.inject(GenericWhateverStringParser);
    genericWhateverParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          nr: 1000
        }
      }
    }

    const testText = `
      <p>Let's load a couple of components like</p>
      [singletag-string]
      [multitag-string]
        [whatever-string][/whatever-string]
      [/multitag-string]
      <p>Really cool stuff.</p>
    `;

    comp.content = testText;
    let loadedComponents: LoadedComponent[] = [];
    comp.componentsLoaded.pipe(first()).subscribe((lc: any) => loadedComponents = lc);
    comp.ngOnChanges({content: true} as any);

    expect(Object.values(comp.hookIndex).length).toBe(3);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[3].componentRef!.instance.constructor.name).toBe('WhateverTestComponent');

    // componentsLoaded should have triggered
    expect(loadedComponents.length).toBe(3);

    expect(loadedComponents[0].hookId).toBe(1);
    expect(loadedComponents[0].hookValue as any).toEqual({openingTag: `[singletag-string]`, closingTag: null, element: null});
    expect(loadedComponents[0].hookParser).toBeDefined();
    expect(loadedComponents[0].componentRef.instance.stringProp).toBe('some random sentence');

    expect(loadedComponents[1].hookId).toBe(2);
    expect(loadedComponents[1].hookValue).toEqual({openingTag: `[multitag-string]`, closingTag: `[/multitag-string]`, element: null});
    expect(loadedComponents[1].hookParser).toBeDefined();
    expect(loadedComponents[1].componentRef.instance.nr).toBe(99);

    expect(loadedComponents[2].hookId).toBe(3);
    expect(loadedComponents[2].hookValue).toEqual({openingTag: `[whatever-string]`, closingTag: `[/whatever-string]`, element: null});
    expect(loadedComponents[2].hookParser).toBeDefined();
    expect(loadedComponents[2].componentRef.instance.nr).toBe(1000);
  });

  it('#should lazy-load components', fakeAsync(() => {
    const genericMultiTagParser = TestBed.inject(GenericMultiTagStringParser);
    genericMultiTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          nr: 4
        }
      }
    }

    // Whatever parsers lazy-loads a component for this test
    const genericWhateverParser = TestBed.inject(GenericWhateverStringParser);
    genericWhateverParser.component = {
      // Simulate that loading this component takes 100ms
      importPromise: () => new Promise(resolve => setTimeout(() => {
        resolve({LazyTestComponent: LazyTestComponent})
      }, 100)),
      importName: 'LazyTestComponent'
    };
    genericWhateverParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          name: 'sleepy'
        }
      }
    }

    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          numberProp: 87
        }
      }
    }

    const testText = `
      <p>
        A couple of components:
        [multitag-string]
          [whatever-string][/whatever-string]
        [/multitag-string]
        [singletag-string]
      </p>
    `;

    comp.content = testText;
    comp.context = context;
    let loadedComponents: LoadedComponent[] = [];
    comp.componentsLoaded.pipe(first()).subscribe((lc: any) => loadedComponents = lc);
    comp.ngOnChanges({content: true, context: true} as any);

    // Everything except the lazy-loaded component should be loaded
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.lazy-component')).toBe(null);    
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);

    expect(Object.values(comp.hookIndex).length).toBe(3);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef).toBeNull();
    expect(comp.hookIndex[3].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');

    // Make sure that onDynamicChanges has triggered on component init
    spyOn(comp.hookIndex[1].componentRef!.instance, 'onDynamicChanges').and.callThrough();
    expect(comp.hookIndex[1].componentRef!.instance.onDynamicChanges['calls'].count()).toBe(0);
    expect(comp.hookIndex[1].componentRef!.instance.changesContext).toEqual(context);
    expect(comp.hookIndex[1].componentRef!.instance.changesContentChildren).toBeUndefined();

    // Make sure that onDynamicMount has not yet triggered
    spyOn(comp.hookIndex[1].componentRef!.instance, 'onDynamicMount').and.callThrough();
    expect(comp.hookIndex[1].componentRef!.instance.onDynamicMount['calls'].count()).toBe(0);
    expect(comp.hookIndex[1].componentRef!.instance.mountContext).toBeUndefined();
    expect(comp.hookIndex[1].componentRef!.instance.mountContentChildren).toBeUndefined();

    // Also, componentsLoaded should not yet have triggered
    expect(loadedComponents).toEqual([]);

    // Wait for imports via fakeAsync()'s tick() that synchronously advances time for testing
    // This didn't always work. Used to have to manually wait by using (done) => {} as the testing wrapper function isntead of faceAsync,
    // then wait via setTimeout() and call done() when testing is finished. This had the disadvantage of actually having to wait for the timeout
    tick(500);

    // Lazy-loaded component should be loaded by now in anchor
    expect(fixture.nativeElement.querySelector('.lazy-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.lazy-component').parentElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('LazyTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.name).toBe('sleepy');

    // Make sure that onDynamicChanges has triggered again (with contentChildren)
    expect(comp.hookIndex[1].componentRef!.instance.onDynamicChanges['calls'].count()).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.changesContext).toEqual(context);
    expect(comp.hookIndex[1].componentRef!.instance.changesContentChildren.length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.changesContentChildren[0].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());

    // Make sure that onDynamicMount has triggered
    expect(comp.hookIndex[1].componentRef!.instance.onDynamicMount['calls'].count()).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.mountContext).toEqual(context);
    expect(comp.hookIndex[1].componentRef!.instance.mountContentChildren.length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.mountContentChildren[0].componentRef.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());

    // ComponentsLoaded should have emitted now and contain the lazy-loaded component
    expect(loadedComponents.length).toBe(3);

    expect(loadedComponents[0].hookId).toBe(1);
    expect(loadedComponents[0].hookValue).toEqual({openingTag: `[multitag-string]`, closingTag: `[/multitag-string]`, element: null});
    expect(loadedComponents[0].hookParser).toBeDefined();
    expect(loadedComponents[0].componentRef.instance.nr).toBe(4);

    expect(loadedComponents[1].hookId).toBe(2);
    expect(loadedComponents[1].hookValue).toEqual({openingTag: `[whatever-string]`, closingTag: `[/whatever-string]`, element: null});
    expect(loadedComponents[1].hookParser).toBeDefined();
    expect(loadedComponents[1].componentRef.instance.name).toBe('sleepy');

    expect(loadedComponents[2].hookId).toBe(3);
    expect(loadedComponents[2].hookValue).toEqual({openingTag: `[singletag-string]`, closingTag: null, element: null});
    expect(loadedComponents[2].hookParser).toBeDefined();
    expect(loadedComponents[2].componentRef.instance.numberProp).toBe(87);
  }));
  
  it('#should check that the "importPromise"-field of lazy-loaded parsers is not the promise itself', () => {
    const genericMultiTagParser = TestBed.inject(GenericMultiTagStringParser);
    genericMultiTagParser.component = {
      // Simulate that loading this component takes 100ms
      importPromise: (new Promise(() => {})) as any,
      importName: 'test'
    };

    spyOn(console, 'error');
    comp.content = 'Should load here: [multitag-string][/multitag-string]';
    comp.ngOnChanges({content: true, parsers: true} as any);

    expect((<any>console.error)['calls'].mostRecent().args[0]).toContain('When lazy-loading a component, the "importPromise"-field must contain a function returning the import-promise, but it contained the promise itself.');
  });

  it('#should not lazy-load components during SSR', fakeAsync(() => {
    let {fixture, comp} = prepareTestingModule(() => [
      provideDynamicHooks({parsers: testParsers}),
      {provide: PLATFORM_ID, useValue: 'server'}
    ]);

    // Whatever parsers lazy-loads a component for this test
    const genericWhateverParser = TestBed.inject(GenericWhateverStringParser);
    genericWhateverParser.component = {
      // Simulate that loading this component takes 100ms
      importPromise: () => new Promise(resolve => setTimeout(() => {
        resolve({LazyTestComponent: LazyTestComponent})
      }, 100)),
      importName: 'LazyTestComponent'
    };

    const testText = `[whatever-string][/whatever-string]`;

    comp.content = testText;
    comp.context = context;
    let loadedComponents: LoadedComponent[] = [];
    comp.componentsLoaded.pipe(first()).subscribe((lc: any) => loadedComponents = lc);
    comp.ngOnChanges({content: true, context: true} as any);

    // Should not be loaded at all, not even entered into hookIndex
    expect(fixture.nativeElement.querySelector('.lazy-component')).toBe(null);
    expect(Object.values(comp.hookIndex).length).toBe(0);
    expect(loadedComponents).toEqual([]);

    tick(500);

    // Same even after waiting
    expect(Object.values(comp.hookIndex).length).toBe(0);
    expect(loadedComponents).toEqual([]);

    // Placeholder anchor should be created, but nothing further
    expect(fixture.nativeElement.querySelector('.lazy-component')).toBe(null);
    expect(fixture.nativeElement.querySelector(anchorElementTag)).not.toBe(null);
    expect(fixture.nativeElement.querySelector(anchorElementTag).classList[0]).not.toBe('lazytest-anchor');
    expect(fixture.nativeElement.querySelector(anchorElementTag).childNodes.length).toBe(0);
  }));

  it('#should remove anchor attributes after loading components', () => {
    comp.content = `Let's try a [singletag-string] as well as a <multitag-element></multitag-element>`;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    expect(Object.values(comp.hookIndex).length).toBe(2);
    const attrs1 = Array.from(comp.hookIndex[1].componentRef?.location.nativeElement.attributes).map((attrObj: any) => attrObj.name);
    expect(attrs1.length).toBe(1);
    expect(attrs1[0]).toContain('_nghost');
    expect(attrs1).not.toContain(anchorAttrHookId);
    expect(attrs1).not.toContain(anchorAttrParseToken);
    const attrs2 = Array.from(comp.hookIndex[2].componentRef?.location.nativeElement.attributes).map((attrObj: any) => attrObj.name);
    expect(attrs2.length).toBe(1);
    expect(attrs2[0]).toContain('_nghost');
    expect(attrs2).not.toContain(anchorAttrHookId);
    expect(attrs2).not.toContain(anchorAttrParseToken);
  });

  it('#should scrub input- and output-attributes even with sanitization disabled', () => {
    const testText = `<multitag-element id="unique-identifier" class="some-class" customattr="asd" [numberprop]="123" (someoutput)="context.maneuvers.modifyParent($event)"></<multitag-element>`;
    comp.content = testText;
    comp.context = context;
    comp.options = {sanitize: false};
    comp.ngOnChanges({content: true, context: true} as any);

    expect(Object.values(comp.hookIndex).length).toBe(1);
    const attrs = Array.from(comp.hookIndex[1].componentRef?.location.nativeElement.attributes).map((attrObj: any) => attrObj.name);
    expect(attrs.includes('id')).toBeTrue();
    expect(attrs.includes('class')).toBeTrue();
    expect(attrs.includes('customattr')).toBeTrue();
    expect(attrs.includes('[numberprop]')).toBeFalse();
    expect(attrs.includes('(someoutput)')).toBeFalse();
  });

});
