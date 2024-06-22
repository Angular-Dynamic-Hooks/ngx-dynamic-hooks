// Custom testing resources
import { defaultBeforeEach } from '../shared';
import { TestBed, TestBedStatic, fakeAsync } from '@angular/core/testing';
import { DynamicHooksComponent, DynamicHooksService, anchorAttrHookId, anchorAttrParseToken, anchorElementTag } from '../../testing-api';
import { ParserFindHookElementsResult } from '../../../lib/services/core/elementHookFinder';
import { MultiTagTestComponent } from '../../resources/components/multiTagTest/multiTagTest.c';
import { GenericMultiTagElementParser } from '../../resources/parsers/genericMultiTagElementParser';

describe('Parser element hooks', () => {
  let testBed: TestBedStatic;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should load a multi tag dynamic component', () => {
    const testText = `<p>This is a multi tag component <multitag-element>This is the inner content.</multitag-element>.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null); // Component has loaded
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('This is the inner content.'); // Transcluded content works
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.innerText).toBe('This is the inner content.');
  });

  it('#should load component element hooks without any other content surrounding them', () => {
    const testText = `<multitag-element></multitag-element>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
  });
  
  it('#should load nested content correctly', fakeAsync(() => {
    const testText = `
      <multitag-element>
        <h1 class="the-title">Hello there!</h1>
        <p class="the-text">this is some text</p>
      </multitag-element>
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(fixture.nativeElement.children[0].tagName).toBe("MULTITAG-ELEMENT"); // Should use existing element as host element
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
      <multitag-element>
        <multitag-element>
          lorem ipsum dolor sit amet
          <multitag-element>
            here is some deeply nested text
            <whatever-element>some inline text</whatever-element>
            <span>And an element at the end</span>
          </multitag-element>
        </multitag-element>
        <multitag-element></multitag-element>
      </multitag-element>
    </p>`;

    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(Object.keys(comp.hookIndex).length).toBe(5);

    const grandParentComponentEl = fixture.nativeElement.children[0].children[0];
    expect(grandParentComponentEl.children[0].className).toBe('multitag-component');

    const parentComponentOneEl = grandParentComponentEl.children[0].children[0];
    const parentComponentTwoEl = grandParentComponentEl.children[0].children[1];
    expect(parentComponentOneEl.children[0].className).toBe('multitag-component');
    expect(parentComponentTwoEl.children[0].className).toBe('multitag-component');

    const childComponentEl = parentComponentOneEl.children[0].children[0];
    expect(childComponentEl.children[0].className).toBe('multitag-component');

    expect(childComponentEl.children[0].childNodes[0].textContent.trim()).toBe('here is some deeply nested text');
    const grandChildComponentOneEl = childComponentEl.children[0].children[0];
    expect(grandChildComponentOneEl.innerText).toBe('some inline text');
    expect(grandChildComponentOneEl.children[0].className).toBe('whatever-component');
    const spanAtEnd = childComponentEl.children[0].children[1];
    expect(spanAtEnd.textContent).toBe('And an element at the end');

    expect(Object.values(comp.hookIndex).length).toBe(5);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[3].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[4].componentRef!.instance.constructor.name).toBe('WhateverTestComponent');
    expect(comp.hookIndex[5].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
  });

  it('#should load even incorrectly nested content-components (as the browser will fix them)', () => {
    const testText = `<p>Overlapping textboxes: <multitag-element>text from multitag<whatever-element>text from inline</multitag-element></whatever-element></p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(Object.values(comp.hookIndex).length).toBe(2);

    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);

    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('WhateverTestComponent');
    expect(fixture.nativeElement.querySelector('.whatever-component')).not.toBe(null);
  });

  it('#should load components at their correct positions', () => {
    const testText = `
    <ul>
      <li>This is the first li-element.</li>
      <li>This is the <whatever-element>second</whatever-element> li-element. It has a component <multitag-element>in it</multitag-element>. Lets put another component <multitag-element>here</multitag-element>.</li>
      <li>This is the third li-element. It has a <a href="https://www.google.de" target="_blank">link</a>.</li>
      <li>
        <span>And this is the last</span>
        <multitag-element>
          <span>element in this test</span>
        </multitag-element>
        <span>that we are looking at.</span>
      </li>
    </ul>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    const ul = fixture.nativeElement.children[0];
    const firstLi = ul.children[0];
    expect(firstLi.innerText).toBe('This is the first li-element.');

    const secondLi = ul.children[1];
    expect(secondLi.innerHTML).toContain('This is the <whatever-element');
    expect(secondLi.children[0].children[0].className).toBe('whatever-component');
    expect(secondLi.children[0].children[0].innerText.trim()).toBe('second');
    expect(secondLi.innerHTML).toContain('</whatever-element> li-element. It has a component <multitag-element');
    expect(secondLi.children[1].children[0].className).toBe('multitag-component');
    expect(secondLi.children[1].children[0].innerText.trim()).toBe('in it');
    expect(secondLi.innerHTML).toContain('</multitag-element>. Lets put another component <multitag-element');
    expect(secondLi.children[2].children[0].className).toBe('multitag-component');
    expect(secondLi.children[2].children[0].innerText.trim()).toBe('here');

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

  fit('#should validate the found hook elements', () => {
    const genericMultiTagElementParser = TestBed.inject(GenericMultiTagElementParser);
    const elementHooksFinder = comp['dynamicHooksService']['elementHooksFinder'];
    spyOn(console, 'warn').and.callThrough();

    // Should warn and ignore found elements that are already marked as anchors
    const contentElement = document.createElement('div');
    const foundElement = document.createElement('div');
    foundElement.setAttribute(anchorAttrHookId, '1');
    foundElement.setAttribute(anchorAttrParseToken, 'asd');

    const parserResults: ParserFindHookElementsResult[] = [
      {
        parser: genericMultiTagElementParser,
        hookElement: foundElement
      }
    ];
    const checkedParserResults = elementHooksFinder['validateHookElements'](parserResults, contentElement);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toContain('Error when checking hook elements - The following element was already found as a hook element, but was found again.');
    expect(checkedParserResults.length).toBe(0);
  });

});
