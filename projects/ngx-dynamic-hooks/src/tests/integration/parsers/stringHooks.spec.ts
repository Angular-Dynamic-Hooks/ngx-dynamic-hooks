// Custom testing resources
import { defaultBeforeEach } from '../shared';
import { TestBedStatic, fakeAsync } from '@angular/core/testing';
import { DynamicHooksComponent, DynamicHooksService } from '../../testing-api';
import { NonServiceTestParser } from '../../resources/parsers/nonServiceTestParser';

describe('Parser string hooks', () => {
  let testBed: TestBedStatic;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should load a single tag dynamic component', () => {
    const testText = `<p>This p-element has a <span>span-element with a component [generic-singletagtest] within it.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null); // Component has loaded
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.querySelector('.singletag-component')).not.toBeNull();
  });

  it('#should load a multi tag dynamic component', () => {
    const testText = `<p>This is a multi tag component [generic-multitagtest]This is the inner content.[/generic-multitagtest].</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null); // Component has loaded
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('This is the inner content.'); // Transcluded content works
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.innerText).toBe('This is the inner content.');
  });
  
  it('#should load just the text if there are no dynamic components', () => {
    const testText = `
    <div>
      <p>This is a bit of prose. If has no dynamic components in it.</p>
      <p>Hopefully, this does not cause the app to explode.</p>
    </div>
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.innerHTML.trim()).toBe(testText.trim());
    expect(Object.values(comp.hookIndex).length).toBe(0);
  });

  it('#should load component hooks without any text surrounding them', () => {
    const testText = `[generic-singletagtest]`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');

    // Try with multitag
    comp.content = `[generic-multitagtest][/generic-multitagtest]`;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');

    // And with a custom parser
    comp.content = 'customhook.';
    comp.parsers = [NonServiceTestParser];
    comp.ngOnChanges({content: true, parsers: true} as any);

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
  });

  
  fit('#should load nested content correctly', fakeAsync(() => {
    const testText = `
      [generic-multitagtest]
        <h1 class="the-title">Hello there!</h1>
        <p class="the-text">this is some text</p>
      [/generic-multitagtest]
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(fixture.nativeElement.children[0].tagName).toBe('MULTITAGTEST');
    const multiTagHostElement = fixture.nativeElement.children[0];

    expect(multiTagHostElement.children.length).toBe(1);
    expect(multiTagHostElement.children[0].className).toBe('multitag-component');
    const multiTagViewElement = multiTagHostElement.children[0];

    // Make sure content is exactly what it should be
    expect(multiTagViewElement.children.length).toBe(2);
    expect(multiTagViewElement.children[0].className).toBe('the-title');
    expect(multiTagViewElement.children[0].innerHTML).toBe('Hello there!');
    expect(multiTagViewElement.children[1].className).toBe('the-text');
    expect(multiTagViewElement.children[1].innerHTML).toBe('this is some text');
  }));

  it('#should load nested content with components correctly', () => {
    const testText = `
    <p>Some advanced nesting:
      [generic-multitagtest]
        [generic-multitagtest]
          lorem ipsum dolor sit amet
          [generic-singletagtest]
          [generic-multitagtest]
            here is some deeply nested text
            [generic-whatever]some inline text[/generic-whatever]
            <span>And an element in between</span>
            [generic-singletagtest]
          [/generic-multitagtest]
        [/generic-multitagtest]
        [generic-multitagtest][/generic-multitagtest]
      [/generic-multitagtest]
    </p>`;

    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(Object.keys(comp.hookIndex).length).toBe(7);

    const grandParentComponentEl = fixture.nativeElement.children[0].children[0];
    expect(grandParentComponentEl.children[0].className).toBe('multitag-component');

    const parentComponentOneEl = grandParentComponentEl.children[0].children[0];
    const parentComponentTwoEl = grandParentComponentEl.children[0].children[1];
    expect(parentComponentOneEl.children[0].className).toBe('multitag-component');
    expect(parentComponentTwoEl.children[0].className).toBe('multitag-component');

    const childComponentOneEl = parentComponentOneEl.children[0].children[0];
    const childComponentTwoEl = parentComponentOneEl.children[0].children[1];
    expect(childComponentOneEl.children[0].className).toBe('singletag-component');
    expect(childComponentTwoEl.children[0].className).toBe('multitag-component');

    const grandcChildComponentOneEl = childComponentTwoEl.children[0].children[0];
    expect(grandcChildComponentOneEl.innerText).toBe('some inline text');
    const spanInBetween = childComponentTwoEl.children[0].children[1];
    const grandcChildComponentTwoEl = childComponentTwoEl.children[0].children[2];
    expect(grandcChildComponentOneEl.children[0].className).toBe('whatever-component');
    expect(spanInBetween.textContent).toBe('And an element in between');
    expect(grandcChildComponentTwoEl.children[0].className).toBe('singletag-component');

    expect(Object.values(comp.hookIndex).length).toBe(7);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[3].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[4].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[5].componentRef!.instance.constructor.name).toBe('WhateverTestComponent');
    expect(comp.hookIndex[6].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[7].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
  });

  it('#should not load incorrectly nested content-components', () => {
    const testText = `<p>Overlapping textboxes: [generic-multitagtest]text from multitag[generic-whatever]text from inline[/generic-multitagtest][/generic-whatever]</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.whatever-component')).toBe(null);
  });

  it('#should load components at their correct positions', () => {
    const testText = `
    <ul>
      <li>This is the first li-element.</li>
      <li>This is the [generic-whatever]second[/generic-whatever] li-element. It has a component [generic-singletagtest] in it. Lets put another component [generic-singletagtest] here.</li>
      <li>This is the third li-element. It has a <a href="https://www.google.de" target="_blank">link</a>.</li>
      <li>
        <span>And this is the last</span>
        [generic-multitagtest]
          <span>element in this test</span>
        [/generic-multitagtest]
        <span>that we are looking at.</span>
      </li>
    </ul>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    const ul = fixture.nativeElement.children[0];
    const firstLi = ul.children[0];
    expect(firstLi.innerText).toBe('This is the first li-element.');

    const secondLi = ul.children[1];
    expect(secondLi.innerHTML).toContain('This is the <whatevertest');
    expect(secondLi.children[0].children[0].className).toBe('whatever-component');
    expect(secondLi.children[0].children[0].innerText.trim()).toBe('second');
    expect(secondLi.innerHTML).toContain('</whatevertest> li-element. It has a component <singletagtest');
    expect(secondLi.children[1].children[0].className).toBe('singletag-component');
    expect(secondLi.innerHTML).toContain('</singletagtest> in it. Lets put another component <singletagtest');
    expect(secondLi.children[2].children[0].className).toBe('singletag-component');
    expect(secondLi.innerHTML).toContain('</singletagtest> here.');

    const thirdLi = ul.children[2];
    expect(thirdLi.innerHTML).toContain('This is the third li-element. It has a <a ');
    expect(thirdLi.children[0].tagName).toBe('A');
    expect(thirdLi.children[0].textContent).toBe('link');
    expect(thirdLi.innerHTML).toContain('</a>.');

    const fourthLi = ul.children[3];
    expect(fourthLi.children[0].tagName).toBe('SPAN');
    expect(fourthLi.children[0].textContent).toBe('And this is the last');
    expect(fourthLi.children[1].children[0].className).toBe('multitag-component');
    expect(fourthLi.children[1].children[0].children[0].tagName).toBe('SPAN');
    expect(fourthLi.children[1].children[0].children[0].textContent).toBe('element in this test');
    expect(fourthLi.children[2].tagName).toBe('SPAN');
    expect(fourthLi.children[2].textContent).toBe('that we are looking at.');
  });

  it('#should validate the HookPositions of parsers', () => {
    const stringHooksFinder = comp['dynamicHooksService']['stringHooksFinder'];
    spyOn(console, 'warn').and.callThrough();

    // 1. Every hook must be in itself well-formed
    // -------------------------------------------

    // openingTagEndIndex must be greater than openingTagStartIndex
    let parserResults: any = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 10,
        openingTagEndIndex: 5
      }
    }];
    stringHooksFinder['validateHookPositions'](parserResults, '');
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions - openingTagEndIndex has to be greater than openingTagStartIndex. Ignoring.');

    // closingTag must start after openingTag
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 15,
        closingTagStartIndex: 10,
        closingTagEndIndex: 20,
      }
    }];
    stringHooksFinder['validateHookPositions'](parserResults, '');
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions - The closing tag must start after the opening tag has concluded. Ignoring.');

    // closingTagEndIndex must be greater than closingTagStartIndex
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 10,
        closingTagStartIndex: 20,
        closingTagEndIndex: 15,
      }
    }];
    stringHooksFinder['validateHookPositions'](parserResults, '');
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions - closingTagEndIndex has to be greater than closingTagStartIndex. Ignoring.');

    // 2. The opening/closing tags of a hook must not overlap with those of another hook
    // ---------------------------------------------------------------------------------
    spyOn(stringHooksFinder, 'generateHookPosWarning' as any).and.callThrough();

    // must not have identical indexes
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 10,
        closingTagStartIndex: 15,
        closingTagEndIndex: 20
      }
    }, {
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 10,
        closingTagStartIndex: 15,
        closingTagEndIndex: 20,
      }
    }];
    stringHooksFinder['validateHookPositions'](parserResults, '');
    expect((stringHooksFinder['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('A hook with the same position as another hook was found. There may be multiple identical parsers active that are looking for the same hook. Ignoring duplicates.');

    // Opening tag must begin after previous opening tag has ended
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 15
      }
    }, {
      parser: null,
      hookPosition: {
        openingTagStartIndex: 10,
        openingTagEndIndex: 20,
      }
    }];
    stringHooksFinder['validateHookPositions'](parserResults, '');
    expect((stringHooksFinder['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions: Hook opening tag starts before previous hook opening tag ends. Ignoring.');

    // Opening tag must not overlap with previous closing tag
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 10,
        closingTagStartIndex: 15,
        closingTagEndIndex: 20
      }
    }, {
      parser: null,
      hookPosition: {
        openingTagStartIndex: 15,
        openingTagEndIndex: 20,
        closingTagStartIndex: 25,
        closingTagEndIndex: 30,
      }
    }];
    stringHooksFinder['validateHookPositions'](parserResults, '');
    expect((stringHooksFinder['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions: Opening tag of hook overlaps with closing tag of previous hook. Ignoring.');

    // Closing tag must not overlap with previous closing tag
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 10,
        closingTagStartIndex: 30,
        closingTagEndIndex: 35
      }
    }, {
      parser: null,
      hookPosition: {
        openingTagStartIndex: 15,
        openingTagEndIndex: 20,
        closingTagStartIndex: 30,
        closingTagEndIndex: 40,
      }
    }];
    stringHooksFinder['validateHookPositions'](parserResults, '');
    expect((stringHooksFinder['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions: Closing tag of hook overlaps with closing tag of previous hook. Ignoring.');

    // Check if hooks are incorrectly nested
    parserResults = [{
      parser: null,
      hookPosition: {
        openingTagStartIndex: 5,
        openingTagEndIndex: 10,
        closingTagStartIndex: 25,
        closingTagEndIndex: 30
      }
    }, {
      parser: null,
      hookPosition: {
        openingTagStartIndex: 15,
        openingTagEndIndex: 20,
        closingTagStartIndex: 35,
        closingTagEndIndex: 40,
      }
    }];
    stringHooksFinder['validateHookPositions'](parserResults, '');
    expect((stringHooksFinder['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('Error when checking hook positions: The closing tag of a nested hook lies beyond the closing tag of the outer hook. Ignoring.');
  });

});
