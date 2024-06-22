import { TestBed } from '@angular/core/testing';

// Testing api resources
import { DynamicHooksComponent, OutletParseResult } from '../testing-api';
import { DynamicHooksService } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach } from './shared';
import { ComponentRef } from '@angular/core';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { GenericMultiTagStringParser } from '../resources/parsers/genericMultiTagStringParser';
import { GenericSingleTagStringParser } from '../resources/parsers/genericSingleTagStringParser';

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

  it('#should create and fill a new HTML-Element by using the DynamicHooksService directly', () => {
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
          fonts: ['arial', 'calibri']
        }
      }
    }

    const testText = `
      <p>This p-element has a <span>span-element with a component [singletag-string]</span> within it.</p>
      <p>Here's another one: [multitag-string][/multitag-string]</p>
    `;

    dynamicHooksService.parse(testText).subscribe((outletParseResult: OutletParseResult) => {
      expect(Object.values(outletParseResult.hookIndex).length).toBe(2);

      expect(outletParseResult.element.querySelector('.singletag-component')).not.toBe(null);
      expect(outletParseResult.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
      expect(outletParseResult.hookIndex[1].componentRef!.instance.stringProp).toBe('/media/maps/valley_of_the_four_winds.png');
      expect(outletParseResult.hookIndex[1].componentRef!.instance.simpleArray).toEqual(["chen stormstout", "nomi"]);

      expect(outletParseResult.element.querySelector('.multitag-component')).not.toBe(null);
      expect(outletParseResult.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
      expect(outletParseResult.hookIndex[2].componentRef!.instance.fonts).toEqual(['arial', 'calibri']);
    });
  });

  it('#should fill an existing HTML-Element by using the DynamicHooksService directly', () => {
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
          fonts: ['arial', 'calibri']
        }
      }
    }

    const testText = `
      <p>This p-element has a <span>span-element with a component [singletag-string]</span> within it.</p>
      <p>Here's another one: [multitag-string][/multitag-string]</p>
    `;

    const existingElement = document.createElement('article');
    existingElement.setAttribute('id', 'myExistingElement');

    dynamicHooksService.parse(testText, {}, null, null, null, null, existingElement, {}).subscribe((outletParseResult: OutletParseResult) => {
      expect(Object.values(outletParseResult.hookIndex).length).toBe(2);

      expect(existingElement.getAttribute('id')).toBe('myExistingElement');
      expect(existingElement.tagName).toBe('ARTICLE');
      expect(existingElement).toBe(outletParseResult.element);

      expect(existingElement.querySelector('.singletag-component')).not.toBe(null);
      expect(outletParseResult.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
      expect(outletParseResult.hookIndex[1].componentRef!.instance.stringProp).toBe('/media/maps/valley_of_the_four_winds.png');
      expect(outletParseResult.hookIndex[1].componentRef!.instance.simpleArray).toEqual(["chen stormstout", "nomi"]);

      expect(existingElement.querySelector('.multitag-component')).not.toBe(null);
      expect(outletParseResult.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
      expect(outletParseResult.hookIndex[2].componentRef!.instance.fonts).toEqual(['arial', 'calibri']);
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
      dynamicHooksService.parse(testText, {}, null, null, null, null, targetElement, {});
    } catch (e) {
      errorMsg = (e as Error).message;
    }
    
    expect(errorMsg).toBe('Lets stop execution here');
    const elementPassedToSanitizer = (dynamicHooksService['contentSanitizer'].sanitize as jasmine.Spy).calls.allArgs()[0][0];
    expect(elementPassedToSanitizer).not.toBe(targetElement);
    expect(targetElement.innerHTML).toBe(targetElementExpectedHtml);
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
      [singletag-string]
      [multitag-string][/multitag-string]
    `;

    dynamicHooksService.parse(testText).subscribe((outletParseResult: OutletParseResult) => {
      const hookIndex = outletParseResult.hookIndex;
      const hostElement = outletParseResult.element;

      expect(Object.keys(hookIndex).length).toBe(2);
      const firstCompRef = hookIndex[1].componentRef;
      const secondCompRef = hookIndex[2].componentRef;
      spyOn<ComponentRef<SingleTagTestComponent>, any>(firstCompRef!, 'destroy').and.callThrough();
      spyOn<ComponentRef<MultiTagTestComponent>, any>(secondCompRef!, 'destroy').and.callThrough();
      expect(firstCompRef!.instance.constructor.name).toBe('SingleTagTestComponent');
      expect(secondCompRef!.instance.constructor.name).toBe('MultiTagTestComponent');
      expect(firstCompRef!.instance.stringProp).toBe('This is the first loaded component');
      expect((firstCompRef as any).destroy['calls'].count()).toBe(0);
      expect((secondCompRef as any).destroy['calls'].count()).toBe(0);

      // Destroy outlet comnponent
      dynamicHooksService.destroy(hookIndex);

      expect(hostElement.innerHTML.trim()).toBe('');
      expect((firstCompRef as any).destroy['calls'].count()).toBe(1);
      expect((secondCompRef as any).destroy['calls'].count()).toBe(1);
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

    dynamicHooksService.parse(testText, context).subscribe((outletParseResult: OutletParseResult) => {
      expect(testValue).toBe('');
      dynamicHooksService.destroy(outletParseResult.hookIndex);
      expect(testValue).toBe('Event triggered from onDestroy!');
    });
  });

});
