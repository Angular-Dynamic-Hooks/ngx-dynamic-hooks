// Custom testing resources
import { defaultBeforeEach } from './shared';
import { TestBed, TestBedStatic } from '@angular/core/testing';
import { DynamicHooksComponent, DynamicHooksService } from '../testing-api';
import { GenericSingleTagStringParser } from '../resources/parsers/genericSingleTagStringParser';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';

describe('Component bindings', () => {
  let testBed: TestBedStatic;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should pass along inputs to dynamic components', () => {
    const someNumber = 8476498;
    const someObj = {
      someArr: ['hello', 'from', 'the', 'parser!']
    };

    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          numberProp: someNumber,
          simpleObject: someObj
        }
      }
    }

    const testText = `Just some component: [singletag-string]">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    const loadedComp = comp.hookIndex[1].componentRef!.instance;
    expect(loadedComp.numberProp).toBe(someNumber);
    expect(loadedComp.simpleObject).toBe(someObj);
  });

  it('#should also work with the newer signal inputs (ng17+)', () => {
    const someObj = {randomProperty: "Hopefully, it also works with signal inputs!"};

    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          signalInput: someObj
        }
      }
    }

    const testText = `Just some component: [singletag-string]">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    const loadedComp = comp.hookIndex[1].componentRef!.instance as SingleTagTestComponent;
    expect(loadedComp.signalInput).toBeInstanceOf(Function);
    expect(loadedComp.signalInput()).toBe(someObj);
  });

  it('#should subscribe to outputs of dynamic components', () => {
    let testVar: any = null;

    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        outputs: {
          genericOutput: event => { testVar = `Output callback was triggered with value ${event}!`; }
        }
      }
    }

    const testText = `Just some component: [singletag-string]">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    const loadedComp = comp.hookIndex[1].componentRef!.instance;
    loadedComp.genericOutput.emit(777);
    expect(testVar).toBe(`Output callback was triggered with value 777!`);
  });

  it('#should ignore letter-casing in binding names from parsers', () => {
    const someObj = {
      someArr: ['hello', 'from', 'the', 'parser!']
    };
    let testVar: any = null;

    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          sImPlEoBjEcT: someObj
        },
        outputs: {
          GeNeRiCoUtPuT: event => { testVar = `Triggered ${event}!`; }
        }
      }
    }

    const testText = `Just some component: [singletag-string]">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    const loadedComp = comp.hookIndex[1].componentRef!.instance;
    expect(loadedComp.simpleObject).toBe(someObj);
    loadedComp.genericOutput.emit('successfully');
    expect(testVar).toBe(`Triggered successfully!`);
  });

  it('#should transform dash-separated binding names from parsers', () => {
    const someObj = {
      someArr: ['hello', 'from', 'the', 'parser!']
    };
    let testVar: any = null;

    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          "variable-in-object": someObj
        },
        outputs: {
          "generic-other-output": event => { testVar = `Triggered ${event}!`; }
        }
      }
    }

    const testText = `Just some component: [singletag-string]">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    const loadedComp = comp.hookIndex[1].componentRef!.instance;
    expect(loadedComp.variableInObject).toBe(someObj);
    loadedComp.genericOtherOutput.emit('successfully');
    expect(testVar).toBe(`Triggered successfully!`);
  });

  it('#should trigger ngOnChanges() after component creation and any time an input changes', () => {
    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          numberProp: context.order
        }
      }
    }

    const testText = `Just some component: [singletag-string]">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    const loadedComp = comp.hookIndex[1].componentRef!.instance;
    expect(loadedComp.ngOnChangesTriggered).toBe(true);
    expect(loadedComp.numberProp).toBe(66);

    // Change bound input and expect ngOnChanges to trigger
    spyOn(loadedComp, 'ngOnChanges').and.callThrough();
    context.order = 77;
    comp.ngDoCheck();

    expect(loadedComp.numberProp).toBe(77);
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(1);
  });

  it('#should resubscribe to outputs if outputs returned by parser changed', () => {
    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        outputs: {
          genericOutput: () => 'someFunction'
        }
      }
    }

    const testText = `[singletag-string]">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    spyOn(comp.hookIndex[1].componentRef!.instance['genericOutput'], 'subscribe').and.callThrough();

    // Change returned output
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        outputs: {
          genericOutput: () => 'someOtherFunction'
        }
      }
    }

    // Trigger cd
    comp.ngDoCheck();

    // Should have resubscribed
    expect(comp.hookIndex[1].componentRef!.instance['genericOutput'].subscribe['calls'].count()).toBe(1);
  });

  it('#should unsubscribe from outputs on destroy', () => {
    let emitValue: any = null;
    let elementEventValue: any = null;
    let documentEventValue: any = null;

    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        outputs: {
          genericOutput: event => { emitValue = `Output callback was triggered with value ${event}!`; }
        }
      }
    }

    const testText = `Just some component: [singletag-string]">`;
    comp.content = testText;
    comp.context = context;
    comp.options = { triggerDOMEvents: true };
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    const loadedComp = comp.hookIndex[1].componentRef!.instance;
    const loadedCompElement: HTMLElement = comp.hookIndex[1].componentRef?.location.nativeElement;

    expect(Object.keys(comp.hookIndex[1].outputSubscriptions).length).toBe(1);
    expect(Object.keys(comp.hookIndex[1].htmlEventSubscriptions).length).toBeGreaterThan(0); // Exact number various with nr of outputs

    // Register html event listeners
    loadedCompElement.addEventListener('genericOutput', event => {
      elementEventValue = (event as CustomEvent).detail;
    });
    document.addEventListener('SingleTagTestComponent.genericOutput', event => {
      documentEventValue = (event as CustomEvent).detail;
    });

    // Destroy loaded components
    comp.reset();

    // Callback or events should not be triggered, so vars still null
    loadedComp.genericOutput.emit(777);
    expect(emitValue).toBe(null);
    expect(elementEventValue).toBe(null);
    expect(documentEventValue).toBe(null);
  });

});
