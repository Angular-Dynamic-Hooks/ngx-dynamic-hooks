// Custom testing resources
import { DynamicHooksComponent } from '../testing-api';
import { defaultBeforeEach } from './shared';

describe('SelectorHookParser', () => {
  let testBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should track all hooks and their bindings with used context variables', () => {
    const testText = `
      <p>Let's test this with two singletag-components</p>
      <dynhooks-singletagtest [simpleObject]="{something: true, contextVar: context.order, nestedArray: [context.$lightSaberCollection]}" [simpleArray]="[true]" (httpResponseReceived)="context.maneuvers.meditate()">
      <dynhooks-singletagtest [numberProp]="567">
      <p>And a multitagcomponent</p>
      <dynhooks-multitagtest [fonts]="['arial', context.greeting]"></dynhooks-multitagtest>
    `;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    // singletag hooks
    const singleTagBindings = (comp as any).activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings).length).toBe(2);

    // First singletag:
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(2);
    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe('{something: true, contextVar: context.order, nestedArray: [context.$lightSaberCollection]}');
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: true, contextVar: context.order, nestedArray: [context.$lightSaberCollection]});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(2);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.order']).toBe(66);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toEqual(context.$lightSaberCollection);

    expect(singleTagBindings[1].inputs['simpleArray'].raw).toBe('[true]');
    expect(singleTagBindings[1].inputs['simpleArray'].value).toEqual([true]);
    expect(Object.keys(singleTagBindings[1].inputs['simpleArray'].boundContextVariables).length).toBe(0);

    expect(Object.keys(singleTagBindings[1].outputs).length).toBe(1);
    expect(singleTagBindings[1].outputs['httpResponseReceived'].raw).toBe('context.maneuvers.meditate()');
    expect(typeof singleTagBindings[1].outputs['httpResponseReceived'].value).toBe('function');
    expect(Object.keys(singleTagBindings[1].outputs['httpResponseReceived'].boundContextVariables).length).toBe(0);

    // Second singletag:
    expect(Object.keys(singleTagBindings[2].inputs).length).toBe(1);
    expect(singleTagBindings[2].inputs['numberProp'].raw).toBe('567');
    expect(singleTagBindings[2].inputs['numberProp'].value).toBe(567);
    expect(Object.keys(singleTagBindings[2].inputs['numberProp'].boundContextVariables).length).toBe(0);

    // multitag hooks
    const multiTagBindings = (comp as any).activeParsers[1]['currentBindings'];
    expect(Object.keys(multiTagBindings).length).toBe(1);

    // First multitag:
    expect(Object.keys(multiTagBindings[3].inputs).length).toBe(1);
    expect(multiTagBindings[3].inputs['fonts'].raw).toBe(`['arial', context.greeting]`);
    expect(multiTagBindings[3].inputs['fonts'].value).toEqual(['arial', context.greeting]);
    expect(Object.keys(multiTagBindings[3].inputs['fonts'].boundContextVariables).length).toBe(1);
    expect(multiTagBindings[3].inputs['fonts'].boundContextVariables['context.greeting']).toBe(context.greeting);
  });

  it('#should remove bindings that cannot be parsed', () => {
    const testText = `<dynhooks-singletagtest [numberProp]="12345" [simpleObject]="{color: 'blue', speed: 100">`; // <-- object has missing closing tag
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    // simpleObject should not be tracked
    const singleTagBindings = (comp as any).activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['numberProp'].value).toBe(12345);
  });

  it('#should preserve binding references on update if binding is static', () => {
    const testText = `<dynhooks-singletagtest [simpleObject]="{something: true, extra: 'hi, this is a string!'}">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // Check bindings
    const singleTagBindings = (comp as any).activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe("{something: true, extra: 'hi, this is a string!'}");
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: true, extra: "hi, this is a string!"});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(0);

    spyOn(comp.activeParsers[0], 'getBindings').and.callThrough();
    const previousRef = singleTagBindings[1].inputs['simpleObject'].value;

    // Trigger cd
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect((comp as any).activeParsers[0].getBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].value).toBe(previousRef);
  });

  it('#should preserve binding references on update if binding has bound context vars, but they have not changed', () => {
    const testText = `<dynhooks-singletagtest [simpleObject]="{something: context.$lightSaberCollection}">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // Check bindings
    const singleTagBindings = (comp as any).activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    spyOn(comp.activeParsers[0], 'getBindings').and.callThrough();
    const previousRef = singleTagBindings[1].inputs['simpleObject'].value;

    // Trigger cd
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect((comp as any).activeParsers[0].getBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].value).toBe(previousRef);
  });

  it('#should preserve binding references on update if binding has bound context vars, and only their content has changed', () => {
    const testText = `<dynhooks-singletagtest [simpleObject]="{something: context.$lightSaberCollection}">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // Check bindings
    const singleTagBindings = (comp as any).activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    spyOn(comp.activeParsers[0], 'getBindings').and.callThrough();
    const previousRef = singleTagBindings[1].inputs['simpleObject'].value;

    // Change content and trigger cd
    context.$lightSaberCollection.push('cyan');
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect((comp as any).activeParsers[0].getBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].value).toBe(previousRef);
  });

  it('#should change binding references on update if binding has bound context vars and they have changed', () => {
    const testText = `<dynhooks-singletagtest [simpleArray]="[context.order]" [simpleObject]="{something: context.$lightSaberCollection}" (httpResponseReceived)="content.maneuvers.getMentalState()">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // Check bindings
    const singleTagBindings = (comp as any).activeParsers[0]['currentBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(2);

    expect(singleTagBindings[1].inputs['simpleArray'].raw).toBe("[context.order]");
    expect(singleTagBindings[1].inputs['simpleArray'].value).toEqual([context.order]);
    expect(Object.keys(singleTagBindings[1].inputs['simpleArray'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleArray'].boundContextVariables['context.order']).toBe(context.order);

    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    expect(singleTagBindings[1].outputs['httpResponseReceived'].raw).toBe('content.maneuvers.getMentalState()');
    expect(typeof singleTagBindings[1].outputs['httpResponseReceived'].value).toBe('function');
    expect(Object.keys(singleTagBindings[1].outputs['httpResponseReceived'].boundContextVariables).length).toBe(0); // Can't be known until the event triggers

    spyOn(comp.activeParsers[0], 'getBindings').and.callThrough();

    // Change bound property and trigger cd
    let previousArrayRef = singleTagBindings[1].inputs['simpleArray'].value;
    let previousObjectRef = singleTagBindings[1].inputs['simpleObject'].value;
    let previousOutputRef = singleTagBindings[1].outputs['httpResponseReceived'].value;
    context.order = 77;
    context.$lightSaberCollection = ['cyan', 'viridian', 'turquoise'];
    context.maneuvers.getMentalState = () => 'happy';
    comp.ngDoCheck();

    // Parser should have changed binding reference on reevaluation
    expect((comp as any).activeParsers[0].getBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[1].inputs['simpleArray'].value).not.toBe(previousArrayRef);
    expect(singleTagBindings[1].inputs['simpleObject'].value).not.toBe(previousObjectRef);
    expect(singleTagBindings[1].outputs['httpResponseReceived'].value).toBe(previousOutputRef); // Output wrapper func refs should never change

    // Test identical by value:
    // If object, binding reference should change even if new context prop is identical by value, as the reference is still different.
    // If primitive, binding reference should not change if identical as they are not compared by reference.
    previousArrayRef = singleTagBindings[1].inputs['simpleArray'].value;
    previousObjectRef = singleTagBindings[1].inputs['simpleObject'].value;
    context.order = 77;
    context.$lightSaberCollection = ['cyan', 'viridian', 'turquoise'];
    comp.ngDoCheck();
    expect((comp as any).activeParsers[0].getBindings['calls'].count()).toBe(2);
    expect(singleTagBindings[1].inputs['simpleArray'].value).toBe(previousArrayRef);
    expect(singleTagBindings[1].inputs['simpleObject'].value).not.toBe(previousObjectRef);
  });

  it('#should replace (currently) invalid context vars with undefined, but fix them when they become available', () => {
    const testText = `<dynhooks-singletagtest [simpleObject]='{validContextVar: context._jediCouncil.kenobi, invalidContextVar: context.sithTriumvirate.kreia}'>`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // One of them should be undefined
    const loadedComp = comp.hookIndex[1].componentRef!.instance;
    expect(loadedComp.simpleObject).toEqual({validContextVar: context._jediCouncil.kenobi, invalidContextVar: undefined});

    // Should automatically fix itself when context var becomes available
    spyOn(loadedComp, 'ngOnChanges').and.callThrough();
    comp.context['sithTriumvirate'] = {kreia: 'you are blind'};
    comp.ngDoCheck();
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(1);
    expect(Object.keys(loadedComp.ngOnChanges['calls'].mostRecent().args[0]).length).toBe(1);
    expect(loadedComp.ngOnChanges['calls'].mostRecent().args[0]['simpleObject']).toBeDefined();
    expect(loadedComp.simpleObject).toEqual({validContextVar: context._jediCouncil.kenobi, invalidContextVar: 'you are blind'});
  });
});
