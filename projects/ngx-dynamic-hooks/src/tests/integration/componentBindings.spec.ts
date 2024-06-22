// Custom testing resources
import { defaultBeforeEach } from './shared';
import { TestBed, TestBedStatic } from '@angular/core/testing';
import { DynamicHooksComponent, DynamicHooksService } from '../testing-api';
import { GenericSingleTagStringParser } from '../resources/parsers/genericSingleTagStringParser';

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
          httpResponseReceived: () => 'someFunction'
        }
      }
    }

    const testText = `[singletag-string]">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    spyOn(comp.hookIndex[1].componentRef!.instance['httpResponseReceived'], 'subscribe').and.callThrough();

    // Change returned output
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        outputs: {
          httpResponseReceived: () => 'someOtherFunction'
        }
      }
    }

    // Trigger cd
    comp.ngDoCheck();

    // Should have resubscribed
    expect(comp.hookIndex[1].componentRef!.instance['httpResponseReceived'].subscribe['calls'].count()).toBe(1);
  });

  it('#should unsubscribe from outputs on destroy', () => {
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

    // Destroy loaded components
    comp.reset();

    // Callback should not be triggered, so testVar still null
    loadedComp.genericOutput.emit(777);
    expect(testVar).toBe(null);
  });

});
