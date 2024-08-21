import { TestBed } from '@angular/core/testing';

// Testing api resources
import { AutoPlatformService, DynamicHooksComponent, ParseResult, anchorElementTag, contentElementAttr, getParseOptionDefaults } from '../testing-api';
import { DynamicHooksService } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule, testParsers } from './shared';
import { ComponentRef, EnvironmentInjector, Injector, createEnvironmentInjector } from '@angular/core';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { GenericMultiTagStringParser } from '../resources/parsers/genericMultiTagStringParser';
import { GenericSingleTagStringParser } from '../resources/parsers/genericSingleTagStringParser';
import { GENERICINJECTIONTOKEN } from '../resources/services/genericInjectionToken';
import { firstValueFrom } from 'rxjs';

/**
 * DynamicHooksService tests
 */
describe('DynamicHooksService', () => {
  let testBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should work without calling provideDynamicHooks', async () => {
    ({testBed} = prepareTestingModule(() => []));

    const parsers = [
      {
        component: SingleTagTestComponent,
        selector: 'singletag-string-selector',
        bracketStyle: {opening: '[', closing: ']'},
        enclosing: false
      },
      {
        component: MultiTagTestComponent,
        selector: 'multitag-string-selector',
        bracketStyle: {opening: '[', closing: ']'}
      },
      {
        component: MultiTagTestComponent,
        selector: 'multitag-element-selector'
      }
    ];

    const testText = `
      <h1>This is a title</h1>
      <section>
        <p>Here is a singletag component: [singletag-string-selector [genericInput]="{someObj: 'test value'}"].</p>:
        <p>And here is a multitag component</p>
        [multitag-string-selector [numberProp]="831"]
          <span>The first inner content</span>
          <multitag-element-selector [simpleObject]="{name: 'Ki-Adi-Mundi'}">
            <blockquote>And the second inner content</blockquote>
          </multitag-element-selector>
        [/multitag-string-selector]
      </section>
    `;

    const dynamicHooksService = testBed.inject(DynamicHooksService);
    const result = await firstValueFrom(dynamicHooksService.parse(testText, parsers));

    const hookIndex = result.hookIndex;
    const rootElement = result.element;

    // Check components
    expect(Object.keys(hookIndex).length).toBe(3);
    expect(hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(hookIndex[3].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(hookIndex[1].componentRef!.instance.genericInput).toEqual({someObj: 'test value'});
    expect(hookIndex[2].componentRef!.instance.numberProp).toBe(831);
    expect(hookIndex[3].componentRef!.instance.simpleObject).toEqual({name: 'Ki-Adi-Mundi'});

    // Check html
    const h1 = rootElement.children[0];
    expect(h1.textContent).toBe('This is a title');
    const section = rootElement.children[1];
    const firstP = section.children[0];
    expect(firstP.childNodes[0].textContent).toBe('Here is a singletag component: ');
    const singletagStringComp = firstP.children[0];
    expect(singletagStringComp.tagName).toBe(anchorElementTag.toUpperCase());
    expect(singletagStringComp.children[0].classList.contains('singletag-component')).toBe(true);
    const secondP = section.children[1];
    expect(secondP.childNodes[0].textContent).toBe('And here is a multitag component');
    const multitagStringComp = section.children[2];
    expect(multitagStringComp.tagName).toBe(anchorElementTag.toUpperCase());
    expect(multitagStringComp.children[0].classList.contains('multitag-component')).toBe(true);
    const span = multitagStringComp.children[0].children[0];
    expect(span.textContent).toBe('The first inner content');
    const multitagElementComp = multitagStringComp.children[0].children[1];
    expect(multitagElementComp.tagName).toBe('MULTITAG-ELEMENT-SELECTOR');
    expect(multitagElementComp.children[0].classList.contains('multitag-component')).toBe(true);
    const blockquote = multitagElementComp.children[0].children[0];
    expect(blockquote.textContent).toBe('And the second inner content');
  });

  it('#should return a parseResult with the expected properties', () => {
    const dynamicHooksService = TestBed.inject(DynamicHooksService);

    // Try defaults
    dynamicHooksService.parse('[singletag-string]').subscribe((parseResult: ParseResult) => {
      expect(Object.values(parseResult.hookIndex).length).toBe(1);
      expect(parseResult.element instanceof Node).toBeTrue();
      expect(parseResult.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');      
      expect(parseResult.context).toBe(null);
      expect(parseResult.usedParsers.length).toBe(8);
      expect(parseResult.usedOptions).toEqual(getParseOptionDefaults());
      expect(parseResult.usedEnvironmentInjector).toEqual(dynamicHooksService['environmentInjector']);
      expect(parseResult.usedInjector).toEqual(dynamicHooksService['injector']);
    });

    // Try custom params
    const div = document.createElement('div');
    const hookIndex = {};
    const options = getParseOptionDefaults();
    options.sanitize = false;
    const customInjector = Injector.create({
      parent: TestBed.inject(Injector),
      providers: [
        {provide: GENERICINJECTIONTOKEN, useValue: { name: 'injector test value' } }
      ]
    });
    const customEnvInjector = createEnvironmentInjector(
      [{provide: GENERICINJECTIONTOKEN, useValue: { name: 'env injector test value' } }],
      TestBed.inject(EnvironmentInjector),
      'MyCustomEnvInjector'
    );
    dynamicHooksService.parse('[singletag-string]', [GenericSingleTagStringParser], {someProp: 'hello!'}, options, null, null, div, hookIndex, customEnvInjector, customInjector).subscribe((parseResult: ParseResult) => {
      expect(Object.values(parseResult.hookIndex).length).toBe(1);
      expect(parseResult.element instanceof Node).toBeTrue();
      expect(parseResult.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
      expect(parseResult.context).toEqual({someProp: 'hello!'});
      expect(parseResult.usedParsers.length).toBe(1);
      expect(parseResult.usedOptions).toEqual(options);
      expect(parseResult.usedEnvironmentInjector).toEqual(customEnvInjector);
      expect(parseResult.usedInjector).toEqual(customInjector);
    });
  });

  it('#should create a new HTML-Element, if target element is not specified', () => {
    const dynamicHooksService = TestBed.inject(DynamicHooksService);

    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          stringPropAlias: "/media/maps/valley_of_the_four_winds.png",
          simpleArray: ["chen stormstout", "nomi"]
        }
      }
    }

    const genericMultiTagParser = TestBed.inject(GenericMultiTagStringParser);
    genericMultiTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          simpleArray: ['arial', 'calibri']
        }
      }
    }

    const testText = `
      <p>This p-element has a <span>span-element with a component [singletag-string]</span> within it.</p>
      <p>Here's another one: [multitag-string][/multitag-string]</p>
    `;

    dynamicHooksService.parse(testText).subscribe((parseResult: ParseResult) => {
      expect(Object.values(parseResult.hookIndex).length).toBe(2);

      expect(parseResult.element.querySelector('.singletag-component')).not.toBe(null);
      expect(parseResult.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
      expect(parseResult.hookIndex[1].componentRef!.instance.stringProp).toBe('/media/maps/valley_of_the_four_winds.png');
      expect(parseResult.hookIndex[1].componentRef!.instance.simpleArray).toEqual(["chen stormstout", "nomi"]);

      expect(parseResult.element.querySelector('.multitag-component')).not.toBe(null);
      expect(parseResult.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
      expect(parseResult.hookIndex[2].componentRef!.instance.simpleArray).toEqual(['arial', 'calibri']);
    });
  });

  it('#should fill out an existing target element, if specified', () => {
    const dynamicHooksService = TestBed.inject(DynamicHooksService);

    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          stringPropAlias: "/media/maps/valley_of_the_four_winds.png",
          simpleArray: ["chen stormstout", "nomi"]
        }
      }
    }

    const genericMultiTagParser = TestBed.inject(GenericMultiTagStringParser);
    genericMultiTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          simpleArray: ['arial', 'calibri']
        }
      }
    }

    const testText = `
      <p>This p-element has a <span>span-element with a component [singletag-string]</span> within it.</p>
      <p>Here's another one: [multitag-string][/multitag-string]</p>
    `;

    const existingElement = document.createElement('article');
    existingElement.setAttribute('id', 'myExistingElement');

    dynamicHooksService.parse(testText, null, null, null, null, null, existingElement, {}).subscribe((parseResult: ParseResult) => {
      expect(Object.values(parseResult.hookIndex).length).toBe(2);

      expect(existingElement.getAttribute('id')).toBe('myExistingElement');
      expect(existingElement.tagName).toBe('ARTICLE');
      expect(existingElement).toBe(parseResult.element);

      expect(existingElement.querySelector('.singletag-component')).not.toBe(null);
      expect(parseResult.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
      expect(parseResult.hookIndex[1].componentRef!.instance.stringProp).toBe('/media/maps/valley_of_the_four_winds.png');
      expect(parseResult.hookIndex[1].componentRef!.instance.simpleArray).toEqual(["chen stormstout", "nomi"]);

      expect(existingElement.querySelector('.multitag-component')).not.toBe(null);
      expect(parseResult.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
      expect(parseResult.hookIndex[2].componentRef!.instance.simpleArray).toEqual(['arial', 'calibri']);
    });
  });

  it('#should operate on a virtual content element before using sanitizer', () => {
    const dynamicHooksService = TestBed.inject(DynamicHooksService);

    const testText = `
      <p>This p-element has a <span>span-element with a component [singletag-string]</span> within it.</p>
    `;

    const targetElement = document.createElement('article');
    const targetElementExpectedHtml = '<div><span id="inner">This should not have been altered.</span></div>';
    targetElement.innerHTML = targetElementExpectedHtml;

    spyOn(dynamicHooksService['contentSanitizer'], 'sanitize').and.throwError('Lets stop execution here');

    let errorMsg = '';
    try {
      dynamicHooksService.parse(testText, null, null, null, null, null, targetElement, {});
    } catch (e) {
      errorMsg = (e as Error).message;
    }
    
    expect(errorMsg).toBe('Lets stop execution here');
    const elementPassedToSanitizer = (dynamicHooksService['contentSanitizer'].sanitize as jasmine.Spy).calls.allArgs()[0][0];
    expect(elementPassedToSanitizer).not.toBe(targetElement);
    expect(targetElement.innerHTML).toBe(targetElementExpectedHtml);
  });

  it('#should add/remove the contentElementAttr to the currently parsed content element', () => {
    const dynamicHooksService = TestBed.inject(DynamicHooksService);
    const platformService = TestBed.inject(AutoPlatformService);
    const setAttributeSpy = spyOn(platformService, 'setAttribute').and.callThrough();
    const removeAttributeSpy = spyOn(platformService, 'removeAttribute').and.callThrough();

    const div = document.createElement('div');
    dynamicHooksService.parse(div).subscribe(result => {
      expect(setAttributeSpy.calls.all().length).toBe(1);
      expect(setAttributeSpy.calls.all()[0].args[0]).toBe(div);
      expect(setAttributeSpy.calls.all()[0].args[1]).toBe(contentElementAttr);
  
      expect(removeAttributeSpy.calls.all().length).toBe(1);
      expect(removeAttributeSpy.calls.all()[0].args[0]).toBe(div);
      expect(removeAttributeSpy.calls.all()[0].args[1]).toBe(contentElementAttr);

      expect(div.hasAttribute(contentElementAttr)).toBe(false);
    });
  });

  it('#should add/remove the contentElementAttr to an optional targetElement', () => {
    const dynamicHooksService = TestBed.inject(DynamicHooksService);
    const platformService = TestBed.inject(AutoPlatformService);
    const setAttributeSpy = spyOn(platformService, 'setAttribute').and.callThrough();
    const removeAttributeSpy = spyOn(platformService, 'removeAttribute').and.callThrough();

    const div = document.createElement('div');
    const targetElement = document.createElement('article');
    dynamicHooksService.parse(div, null, null, null, null, null, targetElement).subscribe(result => {
      expect(setAttributeSpy.calls.all().length).toBe(2);
      expect(setAttributeSpy.calls.all()[0].args[0]).toBe(div);
      expect(setAttributeSpy.calls.all()[0].args[1]).toBe(contentElementAttr);
      expect(setAttributeSpy.calls.all()[1].args[0]).toBe(targetElement);
      expect(setAttributeSpy.calls.all()[1].args[1]).toBe(contentElementAttr);
  
      expect(removeAttributeSpy.calls.all().length).toBe(2);
      expect(removeAttributeSpy.calls.all()[0].args[0]).toBe(div);
      expect(removeAttributeSpy.calls.all()[0].args[1]).toBe(contentElementAttr);
      expect(removeAttributeSpy.calls.all()[1].args[0]).toBe(targetElement);
      expect(removeAttributeSpy.calls.all()[1].args[1]).toBe(contentElementAttr);

      expect(div.hasAttribute(contentElementAttr)).toBe(false);
      expect(targetElement.hasAttribute(contentElementAttr)).toBe(false);
    });
  });

  it('#should destroy loaded components on demand', () => {
    const dynamicHooksService = TestBed.inject(DynamicHooksService);

    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        inputs: {
          stringPropAlias: "This is the first loaded component"
        }
      }
    }

    const testText = `
      <p>Some generic paragraph</p>
      [singletag-string]
      [multitag-string][/multitag-string]
    `;

    const testIsLoadedCorrectly = (result: ParseResult) => {
      expect(Object.keys(result.hookIndex).length).toBe(2);
      const firstCompRef = result.hookIndex[1].componentRef;
      const secondCompRef = result.hookIndex[2].componentRef;
      spyOn<ComponentRef<SingleTagTestComponent>, any>(firstCompRef!, 'destroy').and.callThrough();
      spyOn<ComponentRef<MultiTagTestComponent>, any>(secondCompRef!, 'destroy').and.callThrough();
      expect(firstCompRef!.instance.constructor.name).toBe('SingleTagTestComponent');
      expect(secondCompRef!.instance.constructor.name).toBe('MultiTagTestComponent');
      expect(firstCompRef!.instance.stringProp).toBe('This is the first loaded component');
      expect((firstCompRef as any).destroy['calls'].count()).toBe(0);
      expect((secondCompRef as any).destroy['calls'].count()).toBe(0);

      expect(result.element.children[0].tagName).toBe('P');
      expect(result.element.children[0].textContent).toBe('Some generic paragraph');
      expect(result.element.children[1].tagName).toBe(anchorElementTag.toUpperCase());
      expect(result.element.children[1].children[0].classList.contains('singletag-component')).toBeTrue();
      expect(result.element.children[2].tagName).toBe(anchorElementTag.toUpperCase());
      expect(result.element.children[2].children[0].classList.contains('multitag-component')).toBeTrue();
    };

    const testIsDestroyedCorrectly = (result: ParseResult) => {
      const firstCompRef = result.hookIndex[1].componentRef;
      const secondCompRef = result.hookIndex[2].componentRef;

      // Component html will be fully removed when Angular destroys them, so only paragraph ought to be left
      expect(result.element.innerHTML.trim()).toBe('<p>Some generic paragraph</p>');
      expect((firstCompRef as any).destroy['calls'].count()).toBe(1);
      expect((secondCompRef as any).destroy['calls'].count()).toBe(1);
    };

    // Test destroying via dynamicHooksService.parse
    dynamicHooksService.parse(testText).subscribe((result: ParseResult) => {
      testIsLoadedCorrectly(result);
      dynamicHooksService.destroy(result.hookIndex);
      testIsDestroyedCorrectly(result);
    });

    // Test destroying via result.destroy
    dynamicHooksService.parse(testText).subscribe((result: ParseResult) => {
      testIsLoadedCorrectly(result);
      result.destroy();
      testIsDestroyedCorrectly(result);
    });
  });

  it('#should unsubscribe from outputs only after components are destroyed', () => {
    const dynamicHooksService: DynamicHooksService = TestBed.inject(DynamicHooksService);

    let testValue: string = '';
    const genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
    genericSingleTagParser.onGetBindings = (hookId, hookValue, context) => {
      return {
        outputs: {
          onDestroyEmitter: event => testValue = event
        }
      }
    }

    const testText = `[singletag-string]`;

    dynamicHooksService.parse(testText, null, context).subscribe((parseResult: ParseResult) => {
      expect(testValue).toBe('');
      dynamicHooksService.destroy(parseResult.hookIndex);
      expect(testValue).toBe('Event triggered from onDestroy!');
    });
  });

});
