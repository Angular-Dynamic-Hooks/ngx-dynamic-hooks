// Custom testing resources
import { TestBed } from '@angular/core/testing';
import { MultiTagTestComponent } from '../../resources/components/multiTagTest/multiTagTest.c';
import { SingleTagTestComponent } from '../../resources/components/singleTag/singleTagTest.c';
import { ComponentUpdater, DynamicHooksComponent, ElementSelectorHookParser, SavedBindings } from '../../testing-api';
import { defaultBeforeEach } from '../shared';

describe('ElementSelectorHookParser', () => {
  let testBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // Similar tests to stringSelectorHookParser
  // ----------------------------------------------------------------------------

  it('#should load a multi tag selectors', () => {
    const testText = `<p>This is a multi tag component <multitag-element-selector>This is the inner content.</multitag-element-selector>.</p>`;
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
        <multitag-element-selector [nr]="846" (genericOutput)="context.maneuvers.modifyParent($event)"></multitag-element-selector>
        text in between
        <span>Some span element</span>
        <multitag-element-selector [simpleArray]="['arial', 'roboto', 'noto-sans']">
          Should be parsed fine
          <h2 class='nested-title'>A nested title</h2>
          <multitag-element-selector [simpleArray]='['arial', 'open sans', 'verdana']'></multitag-element-selector>
        </multitag-element-selector>
        <multitag-element-selector></multitag-element-selector>
        <p>And a last paragraph element</p>
      </div>
    `;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    const firstComp: MultiTagTestComponent = comp.hookIndex[1].componentRef!.instance;
    const secondComp: MultiTagTestComponent = comp.hookIndex[2].componentRef!.instance;
    const thirdComp: MultiTagTestComponent = comp.hookIndex[3].componentRef!.instance;
    const fourthComp: MultiTagTestComponent = comp.hookIndex[4].componentRef!.instance;

    // Make sure components are loaded properly
    expect(Object.keys(comp.hookIndex).length).toBe(4);
    expect(firstComp.constructor.name).toBe('MultiTagTestComponent');
    expect(secondComp.constructor.name).toBe('MultiTagTestComponent');
    expect(thirdComp.constructor.name).toBe('MultiTagTestComponent');
    expect(fourthComp.constructor.name).toBe('MultiTagTestComponent');

    // Check html structure
    const topDiv = fixture.nativeElement.children[0];
    expect(topDiv.classList.contains('initial-div')).toBeTrue();
    expect(topDiv.childNodes[0].textContent.trim()).toBe('Some introductory text');

    const firstMultiTagComp = topDiv.childNodes[1];
    expect(firstMultiTagComp.tagName).toBe('MULTITAG-ELEMENT-SELECTOR');
    expect(firstMultiTagComp.children[0].classList.contains('multitag-component')).toBeTrue();

    expect(topDiv.childNodes[2].textContent.trim()).toBe('text in between');
    expect(topDiv.childNodes[3].tagName).toBe('SPAN');
    expect(topDiv.childNodes[3].textContent.trim()).toBe('Some span element');

    const secondMultiTagComp = topDiv.childNodes[5];
    expect(secondMultiTagComp.tagName).toBe('MULTITAG-ELEMENT-SELECTOR');
    expect(secondMultiTagComp.children[0].classList.contains('multitag-component')).toBeTrue();
    expect(secondMultiTagComp.children[0].childNodes[0].textContent.trim()).toBe('Should be parsed fine');
    expect(secondMultiTagComp.children[0].childNodes[1].tagName).toBe('H2');
    expect(secondMultiTagComp.children[0].childNodes[1].classList.contains('nested-title')).toBeTrue();
    expect(secondMultiTagComp.children[0].childNodes[1].textContent.trim()).toBe('A nested title');

    const thirdMultiTagComp = secondMultiTagComp.children[0].childNodes[3];
    expect(thirdMultiTagComp.tagName).toBe('MULTITAG-ELEMENT-SELECTOR');
    expect(thirdMultiTagComp.children[0].classList.contains('multitag-component')).toBeTrue();

    const fourthMultiTagComp = topDiv.childNodes[7];
    expect(fourthMultiTagComp.tagName).toBe('MULTITAG-ELEMENT-SELECTOR');
    expect(fourthMultiTagComp.children[0].classList.contains('multitag-component')).toBeTrue();

    expect(topDiv.childNodes[9].tagName).toBe('P');
    expect(topDiv.childNodes[9].textContent.trim()).toBe('And a last paragraph element');
  });

  fit('#should parse inputs properly', () => {
    const testContent = `
    <multitag-element-selector [simpleArray]="['test', 'something', 'here']"></multitag-element-selector>
    <multitag-element-selector
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
    ></multitag-element-selector>
    <p>This should be untouched</p>`;

    const checkBindings = () => {
      const firstComp: MultiTagTestComponent = comp.hookIndex[1].componentRef!.instance;
      const secondComp: SingleTagTestComponent = comp.hookIndex[2].componentRef!.instance;

      // Make sure components are loaded properly
      expect(Object.keys(comp.hookIndex).length).toBe(2);
      expect(firstComp.constructor.name).toBe('MultiTagTestComponent');
      expect(secondComp.constructor.name).toBe('MultiTagTestComponent');
      expect(fixture.nativeElement.children[2].innerHTML.trim()).toBe('This should be untouched');

      // Check all inputs
      expect(firstComp.simpleArray).toEqual(['test', 'something', 'here']);

      expect((secondComp as any)['id']).toBe(undefined);
      expect(secondComp.inputWithoutBrackets).toBe("{test: 'Hullo!'}");
      expect(secondComp.emptyInputWithoutBrackets).toBe('');
      expect(secondComp.emptyInput).toBeUndefined();
      expect(secondComp.emptyStringInput).toBe('');
      expect(secondComp._weird5Input$Name13).toBe('Even names like this should be recognized.');
      expect(secondComp.nonInputProperty).toBe('this is the default value');
      expect(secondComp.stringProp).toBe('this is just a test string');
      expect(secondComp.dataSomeValue).toBe('this is a data value');
      expect(secondComp.numberProp).toBe(846);
      expect(secondComp.booleanProp).toBe(true);
      expect(secondComp.nullProp).toBe(null);
      expect(secondComp.undefinedProp).toBe(undefined);
      expect(secondComp.simpleObject).toEqual({
        config: {
          lightbox: false,
          size: {
            height: '100px',
            width: '200px'
          }
        }
      });
      expect(secondComp.simpleArray).toEqual([1, 2, 'three', true, null, null, [5, 6]]);
      expect(secondComp.variable).toBe('orange');
      expect(secondComp.variableLookalike).toBe('seems like a var, but isnt: [{context.thisShouldntBeRecognizedAsAVariable}]');
      expect(secondComp.variableInObject).toEqual({
        propInObj: 'kashyyyk'
      });
      expect(secondComp.variableInArray).toEqual(['melon', 'there is no try', 798]);
      expect(secondComp.contextWithoutAnything).toEqual(context);
      expect(secondComp.nestedFunctions).toEqual({
        dangerousStr: 'heres a couple of (dangerous) , chars',
        functionsProp: ['Combo: defending Leia! and attacking the evil Wampa!']
      });
      expect(secondComp.nestedFunctionsInBrackets).toEqual([
        'meditating!', 'vigilant'
      ]);
      expect(secondComp.everythingTogether).toEqual([
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
    };

    // Test with string content
    comp.content = testContent;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    checkBindings();

    // Reset
    comp.reset();

    // Test with element content
    const div = document.createElement('div');
    div.innerHTML = testContent;
    comp.content = div;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);
    checkBindings();

  });

  it('#should parse outputs properly', () => {
    const testText = `<multitag-element-selector [numberProp]="123" (componentClickedAlias)="context.maneuvers.modifyParent($event)"></multitag-element-selector>`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    expect((comp as any)['completelyNewProperty']).toBeUndefined();
    comp.hookIndex[1].componentRef!.instance.componentClicked.emit(555);
    expect((comp as any)['completelyNewProperty']).toBe(555);
  });

  it('#should catch errors if output string cannot be evaluated', () => {
    spyOn(console, 'error').and.callThrough();
    const testText = `<multitag-element-selector (componentClickedAlias)="context.maneuvers.modifyParent($event"></multitag-element-selector>`; // Missing final bracket
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
      <multitag-element-selector [simpleObject]="{something: true, contextVar: context.order, nestedArray: [context.$lightSaberCollection]}" [simpleArray]="[true]" (genericOutput)="context.maneuvers.meditate()"></multitag-element-selector>
      <multitag-element-selector [numberProp]="567"></multitag-element-selector>
      <p>And a multitagcomponent</p>
      <multitag-element-selector [simpleArray]="['arial', context.greeting]"></multitag-element-selector>
    `;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    // Get bindings for hooks
    const allBindings = (comp.activeParsers[7] as ElementSelectorHookParser)['savedBindings'];
    expect(Object.keys(allBindings).length).toBe(3);

    // First multitag:
    const firstBindings = allBindings[1];
    expect(Object.keys(firstBindings.inputs!).length).toBe(2);
    expect(firstBindings.inputs!['simpleobject'].raw).toBe('{something: true, contextVar: context.order, nestedArray: [context.$lightSaberCollection]}');
    expect(firstBindings.inputs!['simpleobject'].value).toEqual({something: true, contextVar: context.order, nestedArray: [context.$lightSaberCollection]});
    expect(Object.keys(firstBindings.inputs!['simpleobject'].boundContextVariables).length).toBe(2);
    expect(firstBindings.inputs!['simpleobject'].boundContextVariables['context.order']).toBe(66);
    expect(firstBindings.inputs!['simpleobject'].boundContextVariables['context.$lightSaberCollection']).toEqual(context.$lightSaberCollection);

    expect(firstBindings.inputs!['simplearray'].raw).toBe('[true]');
    expect(firstBindings.inputs!['simplearray'].value).toEqual([true]);
    expect(Object.keys(firstBindings.inputs!['simplearray'].boundContextVariables).length).toBe(0);

    expect(Object.keys(firstBindings.outputs!).length).toBe(1);
    expect(firstBindings.outputs!['genericoutput'].raw).toBe('context.maneuvers.meditate()');
    expect(typeof firstBindings.outputs!['genericoutput'].value).toBe('function');
    expect(Object.keys(firstBindings.outputs!['genericoutput'].boundContextVariables).length).toBe(0);

    // Second multitag:
    const secondBindings = allBindings[2];
    expect(Object.keys(secondBindings.inputs!).length).toBe(1);
    expect(secondBindings.inputs!['numberprop'].raw).toBe('567');
    expect(secondBindings.inputs!['numberprop'].value).toBe(567);
    expect(Object.keys(secondBindings.inputs!['numberprop'].boundContextVariables).length).toBe(0);

    // Third multitag:
    const thirdBindings = allBindings[3];
    expect(Object.keys(thirdBindings.inputs!).length).toBe(1);
    expect(thirdBindings.inputs!['simplearray'].raw).toBe(`['arial', context.greeting]`);
    expect(thirdBindings.inputs!['simplearray'].value).toEqual(['arial', context.greeting]);
    expect(Object.keys(thirdBindings.inputs!['simplearray'].boundContextVariables).length).toBe(1);
    expect(thirdBindings.inputs!['simplearray'].boundContextVariables['context.greeting']).toBe(context.greeting);
  });

  it('#should remove bindings that cannot be parsed', () => {
    const testText = `<multitag-element-selector [numberProp]="12345" [simpleObject]="{color: 'blue', speed: 100"></multitag-element-selector>`; // <-- object has missing closing tag
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    // simpleObject should not be tracked
    const bindings = (comp as any).activeParsers[7]['savedBindings'];
    expect(Object.keys(bindings[1].inputs).length).toBe(1);
    expect(bindings[1].inputs['numberprop'].value).toBe(12345);
  });

  it('#should preserve binding references on update if binding is static', () => {
    const testText = `<multitag-element-selector [simpleObject]="{something: true, extra: 'hi, this is a string!'}"></multitag-element-selector>`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // Check bindings
    const bindings = (comp as any).activeParsers[7]['savedBindings'];
    expect(Object.keys(bindings[1].inputs).length).toBe(1);
    expect(bindings[1].inputs['simpleobject'].raw).toBe("{something: true, extra: 'hi, this is a string!'}");
    expect(bindings[1].inputs['simpleobject'].value).toEqual({something: true, extra: "hi, this is a string!"});
    expect(Object.keys(bindings[1].inputs['simpleobject'].boundContextVariables).length).toBe(0);

    spyOn(comp.activeParsers[7], 'getBindings').and.callThrough();
    const previousRef = bindings[1].inputs['simpleobject'].value;

    // Trigger cd
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect((comp as any).activeParsers[7].getBindings['calls'].count()).toBe(1);
    expect(bindings[1].inputs['simpleobject'].value).toBe(previousRef);
  });

  it('#should preserve binding references on update if binding has bound context vars, but they have not changed', () => {
    const testText = `<multitag-element-selector [simpleObject]="{something: context.$lightSaberCollection}"></multitag-element-selector>`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // Check bindings
    const bindings = (comp as any).activeParsers[7]['savedBindings'];
    expect(Object.keys(bindings[1].inputs).length).toBe(1);
    expect(bindings[1].inputs['simpleobject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(bindings[1].inputs['simpleobject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(bindings[1].inputs['simpleobject'].boundContextVariables).length).toBe(1);
    expect(bindings[1].inputs['simpleobject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    spyOn(comp.activeParsers[7], 'getBindings').and.callThrough();
    const previousRef = bindings[1].inputs['simpleobject'].value;

    // Trigger cd
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect((comp as any).activeParsers[7].getBindings['calls'].count()).toBe(1);
    expect(bindings[1].inputs['simpleobject'].value).toBe(previousRef);
  });

  it('#should preserve binding references on update if binding has bound context vars, and only their content has changed', () => {
    const testText = `<multitag-element-selector [simpleObject]="{something: context.$lightSaberCollection}"></multitag-element-selector>`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // Check bindings
    const bindings = (comp as any).activeParsers[7]['savedBindings'];
    expect(Object.keys(bindings[1].inputs).length).toBe(1);
    expect(bindings[1].inputs['simpleobject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(bindings[1].inputs['simpleobject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(bindings[1].inputs['simpleobject'].boundContextVariables).length).toBe(1);
    expect(bindings[1].inputs['simpleobject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    spyOn(comp.activeParsers[7], 'getBindings').and.callThrough();
    const previousRef = bindings[1].inputs['simpleobject'].value;

    // Change content and trigger cd
    context.$lightSaberCollection.push('cyan');
    comp.ngDoCheck();

    // Parser should preserve binding reference on reevaluation
    expect((comp as any).activeParsers[7].getBindings['calls'].count()).toBe(1);
    expect(bindings[1].inputs['simpleobject'].value).toBe(previousRef);
  });

  it('#should change binding references on update if binding has bound context vars and they have changed', () => {
    const testText = `<multitag-element-selector [simpleArray]="[context.order]" [simpleObject]="{something: context.$lightSaberCollection}" (genericOutput)="context.maneuvers.getMentalState()"></multitag-element-selector>`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true} as any);

    // Check bindings
    const bindings = (comp as any).activeParsers[7]['savedBindings'];
    expect(Object.keys(bindings[1].inputs).length).toBe(2);

    expect(bindings[1].inputs['simplearray'].raw).toBe("[context.order]");
    expect(bindings[1].inputs['simplearray'].value).toEqual([context.order]);
    expect(Object.keys(bindings[1].inputs['simplearray'].boundContextVariables).length).toBe(1);
    expect(bindings[1].inputs['simplearray'].boundContextVariables['context.order']).toBe(context.order);

    expect(bindings[1].inputs['simpleobject'].raw).toBe("{something: context.$lightSaberCollection}");
    expect(bindings[1].inputs['simpleobject'].value).toEqual({something: context.$lightSaberCollection});
    expect(Object.keys(bindings[1].inputs['simpleobject'].boundContextVariables).length).toBe(1);
    expect(bindings[1].inputs['simpleobject'].boundContextVariables['context.$lightSaberCollection']).toBe(context.$lightSaberCollection);

    expect(bindings[1].outputs['genericoutput'].raw).toBe('context.maneuvers.getMentalState()');
    expect(typeof bindings[1].outputs['genericoutput'].value).toBe('function');
    expect(Object.keys(bindings[1].outputs['genericoutput'].boundContextVariables).length).toBe(0); // Can't be known until the event triggers

    spyOn(comp.activeParsers[7], 'getBindings').and.callThrough();

    // Change bound property and trigger cd
    let previousArrayRef = bindings[1].inputs['simplearray'].value;
    let previousObjectRef = bindings[1].inputs['simpleobject'].value;
    let previousOutputRef = bindings[1].outputs['genericoutput'].value;
    context.order = 77;
    context.$lightSaberCollection = ['cyan', 'viridian', 'turquoise'];
    context.maneuvers.getMentalState = () => 'happy';
    comp.ngDoCheck();

    // Parser should have changed binding reference on reevaluation
    expect((comp as any).activeParsers[7].getBindings['calls'].count()).toBe(1);
    expect(bindings[1].inputs['simplearray'].value).not.toBe(previousArrayRef);
    expect(bindings[1].inputs['simpleobject'].value).not.toBe(previousObjectRef);
    expect(bindings[1].outputs['genericoutput'].value).toBe(previousOutputRef); // Output wrapper func refs should never change

    // Test identical by value:
    // If object, binding reference should change even if new context prop is identical by value, as the reference is still different.
    // If primitive, binding reference should not change if identical as they are not compared by reference.
    previousArrayRef = bindings[1].inputs['simplearray'].value;
    previousObjectRef = bindings[1].inputs['simpleobject'].value;
    context.order = 77;
    context.$lightSaberCollection = ['cyan', 'viridian', 'turquoise'];
    comp.ngDoCheck();
    expect((comp as any).activeParsers[7].getBindings['calls'].count()).toBe(2);
    expect(bindings[1].inputs['simplearray'].value).toBe(previousArrayRef);
    expect(bindings[1].inputs['simpleobject'].value).not.toBe(previousObjectRef);
  });

  it('#should replace (currently) invalid context vars with undefined, but fix them when they become available', () => {
    const testText = `<multitag-element-selector [simpleObject]='{validContextVar: context._jediCouncil.kenobi, invalidContextVar: context.sithTriumvirate.kreia}'></multitag-element-selector>`;
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

  // Extra tests
  // ----------------------------------------------------------------------------

  it('#should not set unrelated attributes as component inputs/properties', () => {  
    const testText = `<multitag-element-selector 
      id="myCustomId" 
      class="example-class" 
      [numberProp]='123'
      [simpleObject]="{someProp: 'hello!'}"
      (genericOutput)="context.maneuvers.modifyParent($event)"
    ></multitag-element-selector>`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true} as any);

    const loadedComp = comp.hookIndex[1].componentRef!.instance;
    
    expect(Object.keys(loadedComp.latestNgOnChangesData)).toEqual(['numberProp', 'simpleObject']);
    expect(loadedComp.id).toBeUndefined();
    expect(loadedComp.class).toBeUndefined();
    expect(loadedComp.numberProp).toBe(123);
    expect(loadedComp.simpleObject).toEqual({someProp: 'hello!'});

    expect((comp as any)['completelyNewProperty']).toBeUndefined();
    loadedComp.genericOutput.emit('Forest');
    expect((comp as any)['completelyNewProperty']).toBe('Forest');
  });

  it('#should scrub input- and output-attributes even with sanitization disabled', () => {
    const testText = `<multitag-element-selector id="unique-identifier" class="some-class" customattr="asd" [numberprop]="123" (someoutput)="context.maneuvers.modifyParent($event)"></<multitag-element-selector>`;
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
