// Custom testing resources
import { defaultBeforeEach } from './shared';
import { OutletComponentWithProviders } from '../resources/components/OutletComponentWithProviders';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { InlineTestComponent } from '../resources/components/inlineTest/inlineTest.c';

describe('Loading dynamic bindings', () => {
  let testBed;
  let fixture: any;
  let comp: OutletComponentWithProviders;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should parse inputs properly', () => {
    const testText = `
    <dynhooks-multitagtest [fonts]="['test', 'something', 'here']"></dynhooks-multitagtest>
    <dynhooks-singletagtest
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
    >
    <p>This should be untouched</p>
    <dynhooks-inlinetest [nr]="123" [config]="{name: 'test', supportedValues: [1, 2, 3], active: true}"></dynhooks-inlinetest>`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    const firstComp: MultiTagTestComponent = comp.hookIndex[1].componentRef.instance;
    const secondComp: SingleTagTestComponent = comp.hookIndex[2].componentRef.instance;
    const thirdComp: InlineTestComponent = comp.hookIndex[3].componentRef.instance;

    // Make sure components are loaded properly
    expect(Object.keys(comp.hookIndex).length).toBe(3);
    expect(firstComp.constructor.name).toBe('MultiTagTestComponent');
    expect(secondComp.constructor.name).toBe('SingleTagTestComponent');
    expect(thirdComp.constructor.name).toBe('InlineTestComponent');
    expect(fixture.nativeElement.children[2].innerHTML.trim()).toBe('This should be untouched');

    // Check all inputs
    expect(firstComp.fonts).toEqual(['test', 'something', 'here']);

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

    expect(thirdComp.nr).toBe(123);
    expect(thirdComp.config).toEqual({name: 'test', supportedValues: [1, 2, 3], active: true});
  });

  it('#should not accept forbidden inputs', () => {
    const testText = `<dynhooks-singletagtest [prototype]="false">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {acceptInputsForAnyProperty: true};
    comp.ngOnChanges({content: true, context: true, options: true});

    const loadedComp: SingleTagTestComponent = comp.hookIndex[1].componentRef.instance;
    expect(loadedComp as any['prototype']).not.toBe(false);
  });

  it('#should parse outputs properly', () => {
    const testText = `<dynhooks-singletagtest [numberProp]="123" (componentClickedAlias)="context.maneuvers.modifyParent($event)">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});

    expect((comp as any)['completelyNewProperty']).toBeUndefined();
    comp.hookIndex[1].componentRef.instance.componentClicked.emit(555);
    expect((comp as any)['completelyNewProperty']).toBe(555);
  });

  it('#should catch errors if output string cannot be evaluated', () => {
    spyOn(console, 'error').and.callThrough();
    const testText = `<dynhooks-singletagtest (componentClickedAlias)="context.maneuvers.modifyParent($event">`; // Missing final bracket
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});

    expect((comp as any)['completelyNewProperty']).toBeUndefined();
    comp.hookIndex[1].componentRef.instance.componentClicked.emit(555);
    expect((comp as any)['completelyNewProperty']).toBe(undefined);
    expect((<any>console.error)['calls'].count(1));
  });
 
});
