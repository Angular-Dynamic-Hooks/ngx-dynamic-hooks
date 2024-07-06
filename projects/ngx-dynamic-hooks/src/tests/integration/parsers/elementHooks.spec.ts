// Custom testing resources
import { defaultBeforeEach } from '../shared';
import { TestBed, TestBedStatic, fakeAsync } from '@angular/core/testing';
import { DynamicHooksComponent, anchorAttrHookId, anchorAttrParseToken, anchorElementTag } from '../../testing-api';
import { ParserFindHookElementsResult } from '../../../lib/services/core/elementHookFinder';
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

  it('#should save the found element and a snapshot of it HookValue', () => {
    comp.content = `Here is an element hook: <multitag-element id="asd" class="hello">asd</multitag-element>`;
    comp.ngOnChanges({content: true} as any);
  
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].value.openingTag).toBe('<multitag-element id="asd" class="hello">');
    expect(comp.hookIndex[1].value.closingTag).toBe('</multitag-element>');
    expect(comp.hookIndex[1].value.element.tagName).toBe('MULTITAG-ELEMENT');
    expect(comp.hookIndex[1].value.elementSnapshot.tagName).toBe('MULTITAG-ELEMENT');

    // Reset
    ({testBed, fixture, comp, context} = defaultBeforeEach());

    // hookValue.element should be actual found element, hookValue.elementSnapshot should be a copy of it
    const div = document.createElement('div');
    const componentElement = document.createElement('multitag-element');
    div.appendChild(componentElement);
    comp.content = div;
    comp.ngOnChanges({content: true} as any);
  
    expect(comp.hookIndex[1].value.element.tagName).toBe('MULTITAG-ELEMENT');
    expect(comp.hookIndex[1].value.elementSnapshot.tagName).toBe('MULTITAG-ELEMENT');
    expect(comp.hookIndex[1].value.element).toBe(componentElement);
    expect(comp.hookIndex[1].value.elementSnapshot).not.toBe(componentElement);
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

  it('#should validate the found hook elements', () => {
    const genericMultiTagElementParser = TestBed.inject(GenericMultiTagElementParser);
    const elementHookFinder = comp['dynamicHooksService']['elementHookFinder'];
    spyOn(console, 'warn').and.callThrough();

    // Should warn and ignore found elements that are already marked with anchors attrs
    let contentElement = document.createElement('div');
    let harmlessElement = document.createElement('div');
    let problemElement = document.createElement('div');
    problemElement.setAttribute(anchorAttrHookId, '1');
    problemElement.setAttribute(anchorAttrParseToken, 'asd');

    let parserResults: ParserFindHookElementsResult[] = [
      {
        parser: genericMultiTagElementParser,
        hookElement: harmlessElement
      },
      {
        parser: genericMultiTagElementParser,
        hookElement: problemElement
      }
    ];
    let checkedParserResults = elementHookFinder['validateHookElements'](parserResults, contentElement);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toContain('Error when checking hook elements - The following element was already found as a hook element, but was found again in the same parse.');
    expect(checkedParserResults.length).toBe(1);
    expect(checkedParserResults[0].hookElement).toBe(harmlessElement);

    // Reset
    ({testBed, fixture, comp, context} = defaultBeforeEach());

    // Should warn and ignore if the same element is found twice
    contentElement = document.createElement('div');
    problemElement = document.createElement('div');

    parserResults = [
      {
        parser: genericMultiTagElementParser,
        hookElement: problemElement
      },
      {
        parser: genericMultiTagElementParser,
        hookElement: problemElement
      }
    ];
    checkedParserResults = elementHookFinder['validateHookElements'](parserResults, contentElement);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toContain('Error when checking hook elements - The following element was already found as a hook element, but was found again in the same parse.');
    expect(checkedParserResults.length).toBe(1);
    expect(checkedParserResults[0].hookElement).toBe(problemElement);

    // Reset
    ({testBed, fixture, comp, context} = defaultBeforeEach());

    // Should warn and ignore found elements that are already being used by loaded Angular components
    contentElement = document.createElement('div');
    harmlessElement = document.createElement('div');
    problemElement = document.createElement('div');
    (problemElement as any).__ngContext__ = 4; // Usually some number

    parserResults = [
      {
        parser: genericMultiTagElementParser,
        hookElement: harmlessElement
      },
      {
        parser: genericMultiTagElementParser,
        hookElement: problemElement
      }
    ];
    checkedParserResults = elementHookFinder['validateHookElements'](parserResults, contentElement);
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toContain('Note: The following element was found as a hook, but is already being used as an active host or view element for an Angular component. Ignoring.');
    expect(checkedParserResults.length).toBe(1);
    expect(checkedParserResults[0].hookElement).toBe(harmlessElement);
  });
  
  it('#should be able to load element hooks via a variety of selectors', () => {
    const genericMultiTagElementParser = TestBed.inject(GenericMultiTagElementParser);
    const setSelector = (selector: string) => genericMultiTagElementParser.onFindHookElements = (contentElement, context) => Array.from(contentElement.querySelectorAll(selector));
    
    // Custom element
    setSelector(`app-mycustomcomponent`);
    let testText = `<div>Let's load a component with a custom selector here: <app-mycustomcomponent>With some content</app-mycustomcomponent></div>.`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.innerText).toBe('With some content');

    // Generic html element
    setSelector(`div.someRandomClass`);
    testText = `<div>Let's load a component within a div here: <div class="someRandomClass">With some content</div></div>.`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.innerText).toBe('With some content');

    // Complex selector
    setSelector(`li[someAttr="cool"]:nth-child(even)`);
    testText = `
      <div>Let's load a component with a complex selector here: 
        <ul>
          <li someAttr="cool">This should not be loaded</li>.
          <li someAttr="cool">This is the first component</li>.
          <li someAttr="cool">This should not be loaded</li>.
          <li someAttr="cool">This is the second component</li>.
        </ul>
      </div>
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
  
    expect(fixture.nativeElement.querySelector('ul li:nth-child(1)').querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('ul li:nth-child(1)').textContent).toContain('This should not be loaded');
    expect(fixture.nativeElement.querySelector('ul li:nth-child(2)').querySelector('.multitag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ul li:nth-child(2)').textContent).toContain('This is the first component');
    expect(fixture.nativeElement.querySelector('ul li:nth-child(3)').querySelector('.multitag-component')).toBeNull();
    expect(fixture.nativeElement.querySelector('ul li:nth-child(3)').textContent).toContain('This should not be loaded');
    expect(fixture.nativeElement.querySelector('ul li:nth-child(4)').querySelector('.multitag-component')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ul li:nth-child(4)').textContent).toContain('This is the second component');
    
    expect(Object.values(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.innerText).toBe('This is the first component');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.location.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(comp.hookIndex[2].componentRef!.location.nativeElement.innerText).toBe('This is the second component');
  });

  it('#should be able to load both string hooks and element hooks side by side', () => {
    let testText = `
      <div>
        <div>Let's load a singletag string hook here: [singletag-string]</div>
        <div>
          And an enclosing one here 
          [multitag-string]
            Nested element hook
            <multitag-element>
              And another singletag string hook [singletag-string]
            </multitag-element>
          [/multitag-string]
        </div>
        <div>
          Reverse the nesting here
          <multitag-element>
            Nested string hook
            [multitag-string]
              With some content
            [/multitag-string]
          </multitag-element>
        </div>
      </div>
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(Object.values(comp.hookIndex).length).toBe(6);

    // Note about hook index order: String hooks come first, followed by all element hooks
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.querySelector(':first-child').classList.contains('singletag-component')).toBeTrue();

    expect(comp.hookIndex[2].componentRef!.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(comp.hookIndex[2].componentRef!.location.nativeElement.querySelector(':first-child').classList.contains('multitag-component')).toBeTrue();
    expect(comp.hookIndex[2].componentRef!.location.nativeElement.children[0].childNodes[0].textContent.trim()).toBe('Nested element hook');
    expect(comp.hookIndex[2].componentRef!.location.nativeElement.children[0].childNodes[1].tagName).toBe('MULTITAG-ELEMENT');

    expect(comp.hookIndex[3].componentRef!.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(comp.hookIndex[3].componentRef!.location.nativeElement.querySelector(':first-child').classList.contains('singletag-component')).toBeTrue();

    expect(comp.hookIndex[4].componentRef!.location.nativeElement.tagName).toBe(anchorElementTag.toUpperCase());
    expect(comp.hookIndex[4].componentRef!.location.nativeElement.querySelector(':first-child').classList.contains('multitag-component')).toBeTrue();
    expect(comp.hookIndex[4].componentRef!.location.nativeElement.children[0].childNodes[0].textContent.trim()).toBe('With some content');

    expect(comp.hookIndex[5].componentRef!.location.nativeElement.tagName).toBe('MULTITAG-ELEMENT');
    expect(comp.hookIndex[5].componentRef!.location.nativeElement.querySelector(':first-child').classList.contains('multitag-component')).toBeTrue();
    expect(comp.hookIndex[5].componentRef!.location.nativeElement.children[0].childNodes[0].textContent.trim()).toBe('And another singletag string hook');
    expect(comp.hookIndex[5].componentRef!.location.nativeElement.children[0].childNodes[1].tagName).toBe(anchorElementTag.toUpperCase());
    
    expect(comp.hookIndex[6].componentRef!.location.nativeElement.tagName).toBe('MULTITAG-ELEMENT');
    expect(comp.hookIndex[6].componentRef!.location.nativeElement.querySelector(':first-child').classList.contains('multitag-component')).toBeTrue();
    expect(comp.hookIndex[6].componentRef!.location.nativeElement.children[0].childNodes[0].textContent.trim()).toBe('Nested string hook');
    expect(comp.hookIndex[6].componentRef!.location.nativeElement.children[0].childNodes[1].tagName).toBe(anchorElementTag.toUpperCase());
  });
});
