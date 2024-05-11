import { TestBed } from '@angular/core/testing';

// Testing api resources
import { DynamicHooksComponent, OutletParseResult } from '../testing-api';
import { DynamicHooksService } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach } from './shared';

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

    const testText = `
      <p>This p-element has a <span>span-element with a component <dynHooks-singletagtest [stringPropAlias]="'/media/maps/valley_of_the_four_winds.png'" [simpleArray]='["chen stormstout", "nomi"]'></span> within it.</p>
      <p>Here's another one: <dynHooks-multiTagTest [fonts]="['arial', 'calibri']"></dynHooks-multiTagTest></p>
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

    const testText = `
      <p>This p-element has a <span>span-element with a component <dynHooks-singletagtest [stringPropAlias]="'/media/maps/valley_of_the_four_winds.png'" [simpleArray]='["chen stormstout", "nomi"]'></span> within it.</p>
      <p>Here's another one: <dynHooks-multiTagTest [fonts]="['arial', 'calibri']"></dynHooks-multiTagTest></p>
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

});
