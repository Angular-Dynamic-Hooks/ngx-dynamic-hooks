import { ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';

// Testing api resources
import { HookIndex, DynamicHooksService, anchorElementTag, DynamicSingleComponent, ComponentUpdater, getParseOptionDefaults} from '../testing-api';

// Custom testing resources
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { Component, ComponentRef } from '@angular/core';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { DynamicHooksSingleOptions } from '../../public-api';


describe('DynamicSingleComponent', () => {
  let testBed: TestBed;
  let fixture: any;
  let comp: DynamicSingleComponent;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true}, // Enables automatic change detection in test module
      ]
    });

    testBed = TestBed,
    fixture = TestBed.createComponent(DynamicSingleComponent);
    comp = fixture.componentInstance;
  });

  // ----------------------------------------------------------------------------

  it('#should have created the main component correctly', () => {
    expect(comp).toBeDefined();
  });

  it('#should load a simple component', async () => {
    comp.component = MultiTagTestComponent;
    comp.ngOnChanges({component: true} as any);

    expect(comp.parseResult).not.toBe(null);
    expect(Object.keys(comp.parseResult!.hookIndex).length).toBe(1);
    expect(comp.parseResult!.hookIndex[1].componentRef?.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(fixture.nativeElement).toBe(comp.parseResult?.element);
    const dynCompElement = comp.parseResult!.element.children[0];
    expect(dynCompElement.tagName).toBe('MULTITAGTEST');
    expect(dynCompElement.children[0].classList.contains('multitag-component')).toBe(true);
  });
  
  it('#should load a component with input and output bindings', () => {
    let testVar: string;

    comp.component = MultiTagTestComponent;
    comp.inputs = {
      simpleObject: {testValue: 'Hello from my test!'}
    }
    comp.outputs = {
      genericOutput: (event: any) => { testVar = `Output callback was triggered with value ${event}!`; }
    }
    comp.ngOnChanges({component: true, inputs: true, outputs: true} as any);

    expect(comp.parseResult).not.toBe(null);
    expect(Object.keys(comp.parseResult!.hookIndex).length).toBe(1);
    const dynComp = comp.parseResult!.hookIndex[1].componentRef!.instance;
    expect(dynComp.constructor.name).toBe('MultiTagTestComponent');
    expect(dynComp.simpleObject).toEqual({testValue: 'Hello from my test!'});
    dynComp.genericOutput.emit(777);
    expect(testVar!).toBe(`Output callback was triggered with value 777!`);
  });

  it('#should error if component is not a valid Angular component', () => {
    class NonComponent {}
    comp.component = NonComponent;
    expect(() => comp.ngOnChanges({component: true} as any)).toThrowError('Provided component class input is not a valid Angular component.');
  });

  it('#should default to standard anchor element if component selector is not a tag name', () => {

    @Component({
      selector: '.myWidget',
      template: '<div class="cssselector-component"></div>',
      standalone: true
    })
    class CssSelectorComponent {}

    comp.component = CssSelectorComponent;
    comp.ngOnChanges({component: true} as any);

    expect(comp.parseResult).not.toBe(null);
    expect(Object.keys(comp.parseResult!.hookIndex).length).toBe(1);
    expect(comp.parseResult!.hookIndex[1].componentRef?.instance.constructor.name).toBe('CssSelectorComponent');
    const dynCompElement = comp.parseResult!.element.children[0];
    expect(dynCompElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(dynCompElement.children[0].classList.contains('cssselector-component')).toBe(true);
  });

  it('#should reset and reload when relevant bindings change', () => {
    const dynHooksService = testBed.inject(DynamicHooksService);
    spyOn(dynHooksService, 'parse').and.callThrough();
    spyOn(comp, 'reset').and.callThrough();
    spyOn(comp, 'loadComponent').and.callThrough();

    // Initialize
    comp.component = MultiTagTestComponent;
    comp.ngOnChanges({component: true} as any);
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(Object.values(comp.parseResult!.hookIndex).length).toBe(1);
    expect(comp.parseResult!.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.reset as any)['calls'].count()).toBe(1);
    expect((comp.loadComponent as any)['calls'].count()).toBe(1);
    expect((dynHooksService.parse as any)['calls'].count()).toBe(1);

    // Change component
    comp.component = SingleTagTestComponent;
    comp.ngOnChanges({component: true} as any);
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(Object.values(comp.parseResult!.hookIndex).length).toBe(1);
    expect(comp.parseResult!.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect((comp.reset as any)['calls'].count()).toBe(2);
    expect((comp.loadComponent as any)['calls'].count()).toBe(2);
    expect((dynHooksService.parse as any)['calls'].count()).toBe(2);
  });

  it('#should update bindings on any change detection run by default', () => {
    const componentUpdater = testBed.get(ComponentUpdater);
    const updateSpyOne = spyOn(comp, 'updateComponent').and.callThrough();
    const updateSpyTwo = spyOn(componentUpdater, 'refresh').and.callThrough();

    comp.component = MultiTagTestComponent;
    comp.inputs = { simpleObject: {testValue: 'Hello from my test!'} }
    comp.ngOnChanges({component: true, inputs: true} as any);

    // Should be start values
    const dynComp = comp.parseResult!.hookIndex[1].componentRef!.instance;
    expect(dynComp.simpleObject).toEqual({testValue: 'Hello from my test!'});
    expect(updateSpyOne.calls.all().length).toBe(0);
    expect(updateSpyTwo.calls.all().length).toBe(0);

    // Change single input, triggering just ngDoCheck
    (comp.inputs as any).simpleObject = {testValue: 'Value was changed!'};
    comp.ngDoCheck();

    // Should have changed
    expect(dynComp.simpleObject).toEqual({testValue: 'Value was changed!'});
    expect(updateSpyOne.calls.all().length).toBe(1);
    expect(updateSpyTwo.calls.all().length).toBe(1);
  });

  it('#should update bindings only on push when specified', () => {
    const componentUpdater = testBed.get(ComponentUpdater);
    const updateSpyOne = spyOn(comp, 'updateComponent').and.callThrough();
    const updateSpyTwo = spyOn(componentUpdater, 'refresh').and.callThrough();

    comp.component = MultiTagTestComponent;
    comp.options = {updateOnPushOnly: true};
    comp.inputs = { simpleObject: {testValue: 'Hello from my test!'} }
    comp.ngOnChanges({component: true, inputs: true} as any);

    // Should be start values
    const dynComp = comp.parseResult!.hookIndex[1].componentRef!.instance;
    expect(dynComp.simpleObject).toEqual({testValue: 'Hello from my test!'});
    expect(updateSpyOne.calls.all().length).toBe(0);
    expect(updateSpyTwo.calls.all().length).toBe(0);

    // Change single input, triggering just ngDoCheck
    (comp.inputs as any).simpleObject = {testValue: 'Value was changed!'};
    comp.ngDoCheck();

    // Should not have changed!
    expect(dynComp.simpleObject).toEqual({testValue: 'Hello from my test!'});
    expect(updateSpyOne.calls.all().length).toBe(0);
    expect(updateSpyTwo.calls.all().length).toBe(0);

    // Change whole "inputs" binding, triggering ngOnChanges
    comp.inputs = {simpleObject: {testValue: 'Value was changed!'}};
    comp.ngOnChanges({ inputs: true } as any);

    // Should have changed
    expect(dynComp.simpleObject).toEqual({testValue: 'Value was changed!'});
    expect(updateSpyOne.calls.all().length).toBe(1);
    expect(updateSpyTwo.calls.all().length).toBe(1);
  });

  it('#should merge DynamicHooksSingleOptions into default ParseOptions', () => {
    const dynHooksService = testBed.inject(DynamicHooksService);
    const componentUpdater = testBed.inject(ComponentUpdater);
    const parseSpy = spyOn(dynHooksService, 'parse').and.callThrough();
    const updateSpy = spyOn(componentUpdater, 'refresh').and.callThrough();

    comp.component = MultiTagTestComponent;
    comp.ngOnChanges({component: true} as any);

    expect(comp.parseOptions).toEqual(getParseOptionDefaults());
    expect(parseSpy.calls.mostRecent().args[5]).toEqual(getParseOptionDefaults());

    // Just some non-default options
    const customOptions: DynamicHooksSingleOptions = {
      updateOnPushOnly: true,
      compareInputsByValue: true,
      compareByValueDepth: 10,
      ignoreInputAliases: true,
      acceptOutputsForAnyObservable: true
    };

    comp.options = customOptions;
    comp.ngOnChanges({options: true} as any);

    const merged = {
      ...getParseOptionDefaults(),
      ...customOptions
    };
    expect(comp.parseOptions).toEqual(merged);
    expect(updateSpy.calls.mostRecent().args[2]).toEqual(merged);
  });

  it('#should output the loaded componentRef when done', () => {
    let loadedComponenRef: ComponentRef<any>;

    comp.component = MultiTagTestComponent;
    comp.componentLoaded.subscribe(ref => loadedComponenRef = ref);
    comp.ngOnChanges({component: true} as any);

    expect(loadedComponenRef!).not.toBeUndefined();
    expect(loadedComponenRef! instanceof ComponentRef).toBe(true);
    expect(loadedComponenRef!.instance.constructor.name).toBe('MultiTagTestComponent');
  });
  
  it('#should destroy the loaded componentRef on onDestroy', () => {
    const dynHooksService = testBed.inject(DynamicHooksService);
    const spy = spyOn(dynHooksService, 'destroy').and.callThrough();

    let wasDestroyed = false;
    let loadedComponenRef: ComponentRef<any>;

    comp.component = MultiTagTestComponent;
    comp.componentLoaded.subscribe(ref => loadedComponenRef = ref);
    comp.ngOnChanges({component: true} as any);
    loadedComponenRef!.onDestroy(() => wasDestroyed = true);

    comp.ngOnDestroy();

    expect((spy.calls.mostRecent().args[0] as HookIndex)[1].componentRef).toBe(loadedComponenRef!);
    expect(wasDestroyed).toBe(true);
  });

});
