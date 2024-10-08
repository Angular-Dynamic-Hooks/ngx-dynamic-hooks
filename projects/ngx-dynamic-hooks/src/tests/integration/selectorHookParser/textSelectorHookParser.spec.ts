// Custom testing resources
import { WhateverTestComponent } from '../../resources/components/whateverTest/whateverTest.c';
import { MultiTagTestComponent } from '../../resources/components/multiTagTest/multiTagTest.c';
import { SingleTagTestComponent } from '../../resources/components/singleTag/singleTagTest.c';
import { DynamicHooksComponent, anchorElementTag } from '../../testing-api';
import { defaultBeforeEach } from '../shared';

describe('TextSelectorHookParser', () => {
  let testBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should load single tag selectors', () => {
    const testText = `<p>This p-element has a <span>span-element with a component [singletag-string-selector [stringPropAlias]="'/media/maps/valley_of_the_four_winds.png'" [simpleArray]='["chen stormstout", "nomi"]']</span> within it.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null); // Component has loaded
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
  });

  it('#should load self-closing selectors', () => {
    const testText = `<p>This p-element has a <span>span-element with a component [multitag-string-selector [stringPropAlias]="'/media/maps/valley_of_the_four_winds.png'" [simpleArray]='["chen stormstout", "nomi"]'/]</span> within it.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null); // Component has loaded
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
  });

  it('#should load a multi tag selectors', () => {
    const testText = `<p>This is a multi tag component [multitag-string-selector]This is the inner content.[/multitag-string-selector].</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null); // Component has loaded
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('This is the inner content.'); // Transcluded content works
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
  });

  it('#should parse the html structure correctly', () => {
    comp.content = `
      <div class='initial-div'>
        Some introductory text
        [singletag-string-selector [numberProp]="846" (genericOutput)="context.maneuvers.modifyParent($event)"]
        text in between
        <span>Some span element</span>
        [multitag-string-selector [simpleArray]="['arial', 'roboto', 'noto-sans']"]
          Should be parsed fine
          [multitag-string-selector [simpleObject]='{options: {lightbox: true}}'/]
          <h2 class='nested-title'>A nested title</h2>
          [singletag-string-selector [simpleObject]='{occupation: "Mailman"}']
        [/multitag-string-selector]
        [singletag-string-selector]
        <p>And a last paragraph element</p>
      </div>
    `;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    // Make sure components are loaded properly
    expect(Object.keys(comp.hookIndex).length).toBe(5);
    const firstComp: SingleTagTestComponent = comp.hookIndex[1].componentRef!.instance;
    const secondComp: MultiTagTestComponent = comp.hookIndex[2].componentRef!.instance;
    const thirdComp: MultiTagTestComponent = comp.hookIndex[3].componentRef!.instance;
    const fourthComp: SingleTagTestComponent = comp.hookIndex[4].componentRef!.instance;
    const fifthComp: SingleTagTestComponent = comp.hookIndex[5].componentRef!.instance;
    expect(firstComp.constructor.name).toBe('SingleTagTestComponent');
    expect(secondComp.constructor.name).toBe('MultiTagTestComponent');
    expect(secondComp.constructor.name).toBe('MultiTagTestComponent');
    expect(fourthComp.constructor.name).toBe('SingleTagTestComponent');
    expect(fifthComp.constructor.name).toBe('SingleTagTestComponent');

    // Check html structure
    const topDiv = fixture.nativeElement.children[0];
    expect(topDiv.classList.contains('initial-div')).toBeTrue();
    expect(topDiv.childNodes[0].textContent.trim()).toBe('Some introductory text');

    const firstSingleTagComp = topDiv.childNodes[1];
    expect(firstSingleTagComp.tagName).toBe('SINGLETAG-STRING-SELECTOR');
    expect(firstSingleTagComp.children[0].classList.contains('singletag-component')).toBeTrue();

    expect(topDiv.childNodes[2].textContent.trim()).toBe('text in between');
    expect(topDiv.childNodes[3].tagName).toBe('SPAN');
    expect(topDiv.childNodes[3].textContent.trim()).toBe('Some span element');

    const firstMultiTagComp = topDiv.childNodes[5];
    expect(firstMultiTagComp.tagName).toBe('MULTITAG-STRING-SELECTOR');
    expect(firstMultiTagComp.children[0].classList.contains('multitag-component')).toBeTrue();
    expect(firstMultiTagComp.children[0].childNodes[0].textContent.trim()).toBe('Should be parsed fine');

    // This one is self-closing
    const secondMultiTagComp = firstMultiTagComp.children[0].children[0];
    expect(secondMultiTagComp.tagName).toBe('MULTITAG-STRING-SELECTOR');
    expect(secondMultiTagComp.children[0].classList.contains('multitag-component')).toBeTrue();

    const h2 = firstMultiTagComp.children[0].children[1];
    expect(h2.tagName).toBe('H2');
    expect(h2.classList.contains('nested-title')).toBeTrue();
    expect(h2.textContent.trim()).toBe('A nested title');

    const secondSingleTagComp = firstMultiTagComp.children[0].children[2];
    expect(secondSingleTagComp.tagName).toBe('SINGLETAG-STRING-SELECTOR');
    expect(secondSingleTagComp.children[0].classList.contains('singletag-component')).toBeTrue();

    const thirdSingleTagComp = topDiv.childNodes[7];
    expect(thirdSingleTagComp.tagName).toBe('SINGLETAG-STRING-SELECTOR');
    expect(thirdSingleTagComp.children[0].classList.contains('singletag-component')).toBeTrue();

    expect(topDiv.childNodes[9].tagName).toBe('P');
    expect(topDiv.childNodes[9].textContent.trim()).toBe('And a last paragraph element');
  });

  it('#should parse inputs properly', () => {
    let testText = `
    [multitag-string-selector 
      [simpleArray]="['test', 'something', 'here']"
    ]
      <p>here is a bit of nested text</p>
      [multitag-string-selector 
        [stringPropAlias]="'along with a self-closing selector'"
        [simpleArray]="['some', 'data', 'in', 'an', 'array']"
      /]
      <span>End of nested content</span>
    [/multitag-string-selector]
    [singletag-string-selector
      id="someid"
      id-with-hyphen="something"
      inputWithoutBrackets="{test: 'Hullo!'}"
      emptyInputWithoutBrackets=""
      [emptyInput]=""
      [emptyStringInput]="''"
      [_weird5Input$Name13]="'Even names like this should be recognized.'"
      [nonInputProperty]="'this should not be set as input'"
      [stringPropAlias]="'this is just a test string'"
      data-somevalue="this is a data value"
      [numberProp]="846"
      [booleanProp]="true"
      [nullProp]="null"
      [undefinedProp]='undefined'
      [simpleObject]='{config: {lightbox: false, size: {width: "200px", height: "100px"}}}'
      [simpleArray]="[1, 2, 'three', true, undefined, null, [5, 6]]"
      [variable]='context["$lightS\\aberCollection"][2]'
      [variableLookalike]='"seems like a var, but isnt: [{context.thisShouldntBeRecognizedAsAVariable}]"'
      [variableInObject]='{propInObj: context["_jediCouncil"].kiAdiMundi[8]["planet"]}'
      [variableInArray]='["melon", context["_jediCouncil"].yoda900, 798]'
      [contextWithoutAnything]="context"
      [nestedFunctions]="{dangerousStr: 'heres a couple of (dangerous) , chars', functionsProp: [context.maneuvers.combo(context.maneuvers.defend('Leia'), context.maneuvers.attack(context.maneuvers.generateEnemy('Wampa')['name']))]}"
      [nestedFunctionsInBrackets]="[
        context.maneuvers[context['maneuvers'].findAppropriateAction(context.maneuvers.getMentalState())]().action,
        context['maneuvers'][context.maneuvers['findAppropriateAction']('peaceful')]().state
      ]"
      [everythingTogether]="[
        'Jar-Jar Binks',
        35,
        {
          someObjProp: [
            true,
            \`hello\`,
            null,
            76,
            '02:46am',
            context.greeting
          ]
        },
        [
          'another',
          'variable',
          context._jediCouncil.skywalker,
          'laststring',
          {
            complexFunctionCall: context.maneuvers[context['maneuvers'].findAppropriateAction(context.maneuvers.getMentalState())]().state
          }
        ]
      ]"
    ]
    <p>This should be untouched</p>`;

    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    // Make sure components are loaded properly    
    expect(Object.keys(comp.hookIndex).length).toBe(3);
    const multiTagComp: MultiTagTestComponent = comp.hookIndex[1].componentRef!.instance;
    const selfClosingComp: SingleTagTestComponent = comp.hookIndex[2].componentRef!.instance;
    const singleTagComp: SingleTagTestComponent = comp.hookIndex[3].componentRef!.instance;
    expect(multiTagComp.constructor.name).toBe('MultiTagTestComponent');
    expect(selfClosingComp.constructor.name).toBe('MultiTagTestComponent');
    expect(singleTagComp.constructor.name).toBe('SingleTagTestComponent');
    expect(fixture.nativeElement.children[2].innerHTML.trim()).toBe('This should be untouched');

    // Check all inputs
    expect(multiTagComp.simpleArray).toEqual(['test', 'something', 'here']);

    expect(selfClosingComp.stringProp).toBe('along with a self-closing selector');
    expect(selfClosingComp.simpleArray).toEqual(['some', 'data', 'in', 'an', 'array']);

    expect((singleTagComp as any)['id']).toBe(undefined);
    expect(singleTagComp.inputWithoutBrackets).toBe("{test: 'Hullo!'}");
    expect(singleTagComp.emptyInputWithoutBrackets).toBe('');
    expect(singleTagComp.emptyInput).toBeUndefined();
    expect(singleTagComp.emptyStringInput).toBe('');
    expect(singleTagComp._weird5Input$Name13).toBe('Even names like this should be recognized.');
    expect(singleTagComp.nonInputProperty).toBe('this is the default value');
    expect(singleTagComp.stringProp).toBe('this is just a test string');
    expect(singleTagComp.dataSomeValue).toBe('this is a data value');
    expect(singleTagComp.numberProp).toBe(846);
    expect(singleTagComp.booleanProp).toBe(true);
    expect(singleTagComp.nullProp).toBe(null);
    expect(singleTagComp.undefinedProp).toBe(undefined);
    expect(singleTagComp.simpleObject).toEqual({
      config: {
        lightbox: false,
        size: {
          height: '100px',
          width: '200px'
        }
      }
    });
    expect(singleTagComp.simpleArray).toEqual([1, 2, 'three', true, null, null, [5, 6]]);
    expect(singleTagComp.variable).toBe('orange');
    expect(singleTagComp.variableLookalike).toBe('seems like a var, but isnt: [{context.thisShouldntBeRecognizedAsAVariable}]');
    expect(singleTagComp.variableInObject).toEqual({
      propInObj: 'kashyyyk'
    });
    expect(singleTagComp.variableInArray).toEqual(['melon', 'there is no try', 798]);
    expect(singleTagComp.contextWithoutAnything).toEqual(context);
    expect(singleTagComp.nestedFunctions).toEqual({
      dangerousStr: 'heres a couple of (dangerous) , chars',
      functionsProp: ['Combo: defending Leia! and attacking the evil Wampa!']
    });
    expect(singleTagComp.nestedFunctionsInBrackets).toEqual([
      'meditating!', 'vigilant'
    ]);
    expect(singleTagComp.everythingTogether).toEqual([
      'Jar-Jar Binks',
      35,
      {
        someObjProp: [
          true,
          'hello',
          null,
          76,
          '02:46am',
          'Hello there!'
        ]
      }, [
        'another',
        'variable',
        undefined,
        'laststring',
        {
          complexFunctionCall: 'calm'
        }
      ]
    ]);
  });

  it('#should parse outputs properly', () => {
    const testText = `[singletag-string-selector [numberProp]="123" (componentClickedAlias)="context.maneuvers.modifyParent($event)"]`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    expect((comp as any)['completelyNewProperty']).toBeUndefined();
    comp.hookIndex[1].componentRef!.instance.componentClicked.emit(555);
    expect((comp as any)['completelyNewProperty']).toBe(555);
  });

  it('#should catch errors if output string cannot be evaluated', () => {
    spyOn(console, 'error').and.callThrough();
    const testText = `[singletag-string-selector (componentClickedAlias)="context.maneuvers.modifyParent($event"]`; // Missing final bracket
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    expect((comp as any)['completelyNewProperty']).toBeUndefined();
    comp.hookIndex[1].componentRef!.instance.componentClicked.emit(555);
    expect((comp as any)['completelyNewProperty']).toBeUndefined();
    expect((<any>console.error)['calls'].count(1));
  });

  it('#should track all hooks and their bindings with used context variables', () => {
    const testText = `
      <p>Let's test this with two singletag-components</p>
      [singletag-string-selector [simpleObject]="{something: true, contextVar: context.order, nestedArray: [context.$lightSaberCollection]}" [simpleArray]="[true]" (genericOutput)="context.maneuvers.meditate()"]
      [singletag-string-selector [numberProp]="567"]
      <p>And a multitagcomponent</p>
      [multitag-string-selector [simpleArray]="['arial', context.greeting]"][/multitag-string-selector]
    `;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    // singletag hooks
    const singleTagBindings = (comp as any).activeParsers[5]['savedBindings'];
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
    expect(singleTagBindings[1].outputs['genericOutput'].raw).toBe('context.maneuvers.meditate()');
    expect(typeof singleTagBindings[1].outputs['genericOutput'].value).toBe('function');
    expect(Object.keys(singleTagBindings[1].outputs['genericOutput'].boundContextVariables).length).toBe(0);

    // Second singletag:
    expect(Object.keys(singleTagBindings[2].inputs).length).toBe(1);
    expect(singleTagBindings[2].inputs['numberProp'].raw).toBe('567');
    expect(singleTagBindings[2].inputs['numberProp'].value).toBe(567);
    expect(Object.keys(singleTagBindings[2].inputs['numberProp'].boundContextVariables).length).toBe(0);

    // multitag hooks
    const multiTagBindings = (comp as any).activeParsers[6]['savedBindings'];
    expect(Object.keys(multiTagBindings).length).toBe(1);

    // First multitag:
    expect(Object.keys(multiTagBindings[3].inputs).length).toBe(1);
    expect(multiTagBindings[3].inputs['simpleArray'].raw).toBe(`['arial', context.greeting]`);
    expect(multiTagBindings[3].inputs['simpleArray'].value).toEqual(['arial', context.greeting]);
    expect(Object.keys(multiTagBindings[3].inputs['simpleArray'].boundContextVariables).length).toBe(1);
    expect(multiTagBindings[3].inputs['simpleArray'].boundContextVariables['context.greeting']).toBe(context.greeting);
  });

  it('#should remove bindings that cannot be parsed', () => {
    const testText = `[singletag-string-selector  [numberProp]="12345" [simpleObject]="{color: 'blue', speed: 100"]`; // <-- object has missing closing tag
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    // simpleObject should not be tracked
    const singleTagBindings = (comp as any).activeParsers[5]['savedBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['numberProp'].value).toBe(12345);
  });

  it('#should preserve binding references on update if binding is static', () => {
    const testText = `[singletag-string-selector [simpleObject]="{something: true, extra: 'hi, this is a string!'}"]`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // Check bindings
    const singleTagBindings = (comp as any).activeParsers[5]['savedBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe("{something: true, extra: 'hi, this is a string!'}");
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: true, extra: "hi, this is a string!"});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(0);

    spyOn(comp.activeParsers[5], 'getBindings').and.callThrough();
    const previousRef = singleTagBindings[1].inputs['simpleObject'].value;

    // Trigger cd
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect((comp as any).activeParsers[5].getBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].value).toBe(previousRef);
  });

  it('#should preserve binding references on update if binding has bound context vars, but they have not changed', () => {
    const testText = `[singletag-string-selector  [simpleObject]="{something: context.$lightSaberCollection}"]`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // Check bindings
    const singleTagBindings = (comp as any).activeParsers[5]['savedBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    spyOn(comp.activeParsers[5], 'getBindings').and.callThrough();
    const previousRef = singleTagBindings[1].inputs['simpleObject'].value;

    // Trigger cd
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect((comp as any).activeParsers[5].getBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].value).toBe(previousRef);
  });

  it('#should preserve binding references on update if binding has bound context vars, and only their content has changed', () => {
    const testText = `[singletag-string-selector [simpleObject]="{something: context.$lightSaberCollection}"]`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // Check bindings
    const singleTagBindings = (comp as any).activeParsers[5]['savedBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    spyOn(comp.activeParsers[5], 'getBindings').and.callThrough();
    const previousRef = singleTagBindings[1].inputs['simpleObject'].value;

    // Change content and trigger cd
    context.$lightSaberCollection.push('cyan');
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect((comp as any).activeParsers[5].getBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].value).toBe(previousRef);
  });

  it('#should change binding references on update if binding has bound context vars and they have changed', () => {
    const testText = `[singletag-string-selector  [simpleArray]="[context.order]" [simpleObject]="{something: context.$lightSaberCollection}" (genericOutput)="content.maneuvers.getMentalState()"]`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // Check bindings
    const singleTagBindings = (comp as any).activeParsers[5]['savedBindings'];
    expect(Object.keys(singleTagBindings[1].inputs).length).toBe(2);

    expect(singleTagBindings[1].inputs['simpleArray'].raw).toBe("[context.order]");
    expect(singleTagBindings[1].inputs['simpleArray'].value).toEqual([context.order]);
    expect(Object.keys(singleTagBindings[1].inputs['simpleArray'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleArray'].boundContextVariables['context.order']).toBe(context.order);

    expect(singleTagBindings[1].inputs['simpleObject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(singleTagBindings[1].inputs['simpleObject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(singleTagBindings[1].inputs['simpleObject'].boundContextVariables).length).toBe(1);
    expect(singleTagBindings[1].inputs['simpleObject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    expect(singleTagBindings[1].outputs['genericOutput'].raw).toBe('content.maneuvers.getMentalState()');
    expect(typeof singleTagBindings[1].outputs['genericOutput'].value).toBe('function');
    expect(Object.keys(singleTagBindings[1].outputs['genericOutput'].boundContextVariables).length).toBe(0); // Can't be known until the event triggers

    spyOn(comp.activeParsers[5], 'getBindings').and.callThrough();

    // Change bound property and trigger cd
    let previousArrayRef = singleTagBindings[1].inputs['simpleArray'].value;
    let previousObjectRef = singleTagBindings[1].inputs['simpleObject'].value;
    let previousOutputRef = singleTagBindings[1].outputs['genericOutput'].value;
    context.order = 77;
    context.$lightSaberCollection = ['cyan', 'viridian', 'turquoise'];
    context.maneuvers.getMentalState = () => 'happy';
    comp.ngDoCheck();

    // Parser should have changed binding reference on reevaluation
    expect((comp as any).activeParsers[5].getBindings['calls'].count()).toBe(1);
    expect(singleTagBindings[1].inputs['simpleArray'].value).not.toBe(previousArrayRef);
    expect(singleTagBindings[1].inputs['simpleObject'].value).not.toBe(previousObjectRef);
    expect(singleTagBindings[1].outputs['genericOutput'].value).toBe(previousOutputRef); // Output wrapper func refs should never change

    // Test identical by value:
    // If object, binding reference should change even if new context prop is identical by value, as the reference is still different.
    // If primitive, binding reference should not change if identical as they are not compared by reference.
    previousArrayRef = singleTagBindings[1].inputs['simpleArray'].value;
    previousObjectRef = singleTagBindings[1].inputs['simpleObject'].value;
    context.order = 77;
    context.$lightSaberCollection = ['cyan', 'viridian', 'turquoise'];
    comp.ngDoCheck();
    expect((comp as any).activeParsers[5].getBindings['calls'].count()).toBe(2);
    expect(singleTagBindings[1].inputs['simpleArray'].value).toBe(previousArrayRef);
    expect(singleTagBindings[1].inputs['simpleObject'].value).not.toBe(previousObjectRef);
  });

  it('#should replace (currently) invalid context vars with undefined, but fix them when they become available', () => {
    const testText = `[singletag-string-selector  [simpleObject]='{validContextVar: context._jediCouncil.kenobi, invalidContextVar: context.sithTriumvirate.kreia}']`;
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
