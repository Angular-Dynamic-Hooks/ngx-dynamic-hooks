// Custom testing resources
import { defaultBeforeEach } from '../shared';
import { TestBedStatic, fakeAsync } from '@angular/core/testing';
import { DynamicHooksComponent, anchorElementTag } from '../../testing-api';
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
    const testText = `<p>This p-element has a <span>span-element with a component [singletag-string] within it.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null); // Component has loaded
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.querySelector('.singletag-component')).not.toBeNull();
  });

  it('#should load a multi tag dynamic component', () => {
    const testText = `<p>This is a multi tag component [multitag-string]This is the inner content.[/multitag-string].</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null); // Component has loaded
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('This is the inner content.'); // Transcluded content works
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.querySelector('.multitag-component')).not.toBeNull();
    expect(comp.hookIndex[1].componentRef!.location.nativeElement.innerText).toBe('This is the inner content.');
  });

  it('#should load component hooks without any text surrounding them', () => {
    const testText = `[singletag-string]`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');

    // Try with multitag
    comp.content = `[multitag-string][/multitag-string]`;
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

  it('#should save the found opening and closing tags in HookValue', () => {
    comp.content = `
      Here is some string hook: [singletag-string]
      And another: [multitag-string]asd[/multitag-string]
    `;

    comp.ngOnChanges({content: true} as any);
    const hookIndex = comp.hookIndex;
  
    expect(Object.keys(hookIndex).length).toBe(2);

    expect(hookIndex[1].value.openingTag).toBe('[singletag-string]');
    expect(hookIndex[1].value.closingTag).toBe(null);
    expect(hookIndex[1].value.element).toBe(null);
    expect(hookIndex[1].value.elementSnapshot).toBe(null);

    expect(hookIndex[2].value.openingTag).toBe('[multitag-string]');
    expect(hookIndex[2].value.closingTag).toBe('[/multitag-string]');
    expect(hookIndex[2].value.element).toBe(null);
    expect(hookIndex[2].value.elementSnapshot).toBe(null);
  });

  it('#should load components at their correct positions', () => {
    const testText = `
    <ul>
      <li>This is the first li-element.</li>
      <li>This is the [whatever-string]second[/whatever-string] li-element. It has a component [singletag-string] in it. Lets put another component [singletag-string] here.</li>
      <li>This is the third li-element. It has a <a href="https://www.google.de" target="_blank">link</a>.</li>
      <li>
        <span>And this is the last</span>
        [multitag-string]
          <span>element in this test</span>
        [/multitag-string]
        <span>that we are looking at.</span>
      </li>
    </ul>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    const ul = fixture.nativeElement.children[0];
    const firstLi = ul.children[0];
    expect(firstLi.innerText).toBe('This is the first li-element.');

    const secondLi = ul.children[1];
    expect(secondLi.innerHTML).toContain('This is the <' + anchorElementTag);
    expect(secondLi.children[0].children[0].className).toBe('whatever-component');
    expect(secondLi.children[0].children[0].innerText.trim()).toBe('second');
    expect(secondLi.innerHTML).toContain('</' + anchorElementTag + '> li-element. It has a component <' + anchorElementTag);
    expect(secondLi.children[1].children[0].className).toBe('singletag-component');
    expect(secondLi.innerHTML).toContain('</' + anchorElementTag + '> in it. Lets put another component <' + anchorElementTag);
    expect(secondLi.children[2].children[0].className).toBe('singletag-component');
    expect(secondLi.innerHTML).toContain('</' + anchorElementTag + '> here.');

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
      [multitag-string]
        <h1 class="the-title">Hello there!</h1>
        <p class="the-text">this is some text</p>
      [/multitag-string]
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(fixture.nativeElement.children[0].tagName).toBe(anchorElementTag.toUpperCase());
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
      [multitag-string]
        [multitag-string]
          lorem ipsum dolor sit amet
          [singletag-string]
          [multitag-string]
            here is some deeply nested text
            [whatever-string]some inline text[/whatever-string]
            <span>And an element in between</span>
            [singletag-string]
          [/multitag-string]
        [/multitag-string]
        [multitag-string][/multitag-string]
      [/multitag-string]
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

    expect(childComponentTwoEl.children[0].childNodes[0].textContent.trim()).toBe('here is some deeply nested text');
    const grandChildComponentOneEl = childComponentTwoEl.children[0].children[0];
    expect(grandChildComponentOneEl.innerText).toBe('some inline text');
    const spanInBetween = childComponentTwoEl.children[0].children[1];
    const grandChildComponentTwoEl = childComponentTwoEl.children[0].children[2];
    expect(grandChildComponentOneEl.children[0].className).toBe('whatever-component');
    expect(spanInBetween.textContent).toBe('And an element in between');
    expect(grandChildComponentTwoEl.children[0].className).toBe('singletag-component');

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
    const testText = `<p>Overlapping textboxes: [multitag-string]text from multitag[whatever-string]text from inline[/multitag-string][/whatever-string]</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.whatever-component')).toBe(null);
  });

  it('#should validate the found hook positions', () => {
    const stringHookFinder = comp['dynamicHooksService']['stringHookFinder'];
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
    stringHookFinder['validateHookPositions'](parserResults, '');
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('String hook error: openingTagEndIndex has to be greater than openingTagStartIndex. Ignoring.');

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
    stringHookFinder['validateHookPositions'](parserResults, '');
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('String hook error: closingTagStartIndex has to be greater than openingTagEndIndex. Ignoring.');

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
    stringHookFinder['validateHookPositions'](parserResults, '');
    expect((<any>console.warn)['calls'].mostRecent().args[0]).toBe('String hook error: closingTagEndIndex has to be greater than closingTagStartIndex. Ignoring.');

    // 2. The opening/closing tags of a hook must not overlap with those of another hook
    // ---------------------------------------------------------------------------------
    spyOn(stringHookFinder, 'generateHookPosWarning' as any).and.callThrough();

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
    stringHookFinder['validateHookPositions'](parserResults, '');
    expect((stringHookFinder['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('A string hook with the same position as another string hook was found. There may be multiple parsers looking for the same text pattern. Ignoring duplicates.');

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
    stringHookFinder['validateHookPositions'](parserResults, '');
    expect((stringHookFinder['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('String hook error: Hook opening tag starts before previous hook opening tag ends. Ignoring.');

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
    stringHookFinder['validateHookPositions'](parserResults, '');
    expect((stringHookFinder['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('String hook error: Opening tag of hook overlaps with closing tag of previous hook. Ignoring.');

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
    stringHookFinder['validateHookPositions'](parserResults, '');
    expect((stringHookFinder['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('String hook error: Closing tag of hook overlaps with closing tag of previous hook. Ignoring.');

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
    stringHookFinder['validateHookPositions'](parserResults, '');
    expect((stringHookFinder['generateHookPosWarning'] as any)['calls'].mostRecent().args[0]).toBe('String hook error: The closing tag of a nested hook lies beyond the closing tag of the outer hook. Ignoring.');
  });


});
