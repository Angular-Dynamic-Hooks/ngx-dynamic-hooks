// Testing api resources
import { firstValueFrom } from 'rxjs';
import { GenericMultiTagElementParser } from '../resources/parsers/genericMultiTagElementParser';
import { GenericMultiTagStringParser } from '../resources/parsers/genericMultiTagStringParser';
import { ComponentCreator, DynamicHooksComponent, DynamicHooksService, HookFinder, ParseResult, StringHookFinder, anchorElementTag } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach } from './shared';
import { TestBed } from '@angular/core/testing';


describe('Element content', () => {
  let testBed: TestBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });
  
  it('#should load string hooks (even if enclosing ones are separated by nodes)', () => {
    const stringHookFinder = TestBed.inject(StringHookFinder);
    spyOn(stringHookFinder, 'checkElement').and.callThrough();

    const div = document.createElement('div')
    div.innerHTML = `
      <section>
        Here should be the first component: [whatever-string][/whatever-string]
      </section>
      <article>
        Lets try another with nested content:
        [multitag-string]
          this is the inner content
          <div class='nested-div-first'>
            A nested div
          </div>
          yet more text
          <div class='nested-div-second'>
            And a nested component [singletag-string]. Pretty neat.
          </div>
          and a final bit of text
        [/multitag-string]
      </article>
    `;

    comp.content = div;
    comp.ngOnChanges({content: true} as any);

    expect((stringHookFinder.checkElement as jasmine.Spy).calls.all().length).not.toBe(0);

    // Expect everything to be loaded in have to expected structure
    expect(Object.values(comp.hookIndex).length).toBe(3);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('WhateverTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[3].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');

    const firstSection = fixture.nativeElement.children[0];
    expect(firstSection.childNodes[0].textContent).toContain('Here should be the first component');
    expect(firstSection.childNodes[1].tagName).toBe(anchorElementTag.toUpperCase());
    expect(firstSection.childNodes[1].querySelector('.whatever-component')).not.toBe(null);

    const article = fixture.nativeElement.children[1];
    expect(article.childNodes[0].textContent).toContain('Lets try another with nested content:');
    expect(article.childNodes[1].tagName).toBe(anchorElementTag.toUpperCase());
    expect(article.childNodes[1].children[0].classList.contains('multitag-component')).toBeTrue();

    const multitag = article.childNodes[1].children[0];
    expect(multitag.childNodes[0].textContent).toContain('this is the inner content');
    expect(multitag.childNodes[1].tagName).toBe('DIV');
    expect(multitag.childNodes[1].classList.contains('nested-div-first')).toBeTrue();
    expect(multitag.childNodes[1].textContent).toContain('A nested div');
    expect(multitag.childNodes[2].textContent).toContain('yet more text');
    expect(multitag.childNodes[3].tagName).toBe('DIV');
    expect(multitag.childNodes[3].classList.contains('nested-div-second')).toBeTrue();
    expect(multitag.childNodes[4].textContent).toContain('and a final bit of text');

    const deeplyNestedDiv = multitag.childNodes[3];
    expect(deeplyNestedDiv.childNodes[0].textContent).toContain('And a nested component ');
    expect(deeplyNestedDiv.childNodes[1].tagName).toBe(anchorElementTag.toUpperCase());
    expect(deeplyNestedDiv.childNodes[1].querySelector('.singletag-component')).not.toBe(null);
    expect(deeplyNestedDiv.childNodes[2].textContent).toContain('Pretty neat.'); 
  });

  it('#should load element hooks', () => {
    const stringHookFinder = TestBed.inject(StringHookFinder);
    spyOn(stringHookFinder, 'findInElement').and.callThrough();

    const div = document.createElement('div')
    div.innerHTML = `
      <section>
        Here should be the first component: <whatever-element></whatever-element>
      </section>
      <article>
        Lets try another with nested content:
        <multitag-element>
          this is the inner content
          <div class='nested-div-first'>
            A nested div
          </div>
          yet more text
          <div class='nested-div-second'>
            And a nested component <whatever-element></whatever-element>. Pretty neat.
          </div>
          and a final bit of text
        </multitag-element>
      </article>
    `;

    comp.content = div;
    comp.ngOnChanges({content: true} as any);

    expect((stringHookFinder.findInElement as jasmine.Spy).calls.all().length).not.toBe(0);

    // Expect everything to be loaded in have to expected structure
    expect(Object.values(comp.hookIndex).length).toBe(3);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('WhateverTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[3].componentRef!.instance.constructor.name).toBe('WhateverTestComponent');

    const firstSection = fixture.nativeElement.children[0];
    expect(firstSection.childNodes[0].textContent).toContain('Here should be the first component');
    expect(firstSection.childNodes[1].tagName).toBe('WHATEVER-ELEMENT');
    expect(firstSection.childNodes[1].querySelector('.whatever-component')).not.toBe(null);

    const article = fixture.nativeElement.children[1];
    expect(article.childNodes[0].textContent).toContain('Lets try another with nested content:');
    expect(article.childNodes[1].tagName).toBe('MULTITAG-ELEMENT');
    expect(article.childNodes[1].children[0].classList.contains('multitag-component')).toBeTrue();

    const multitag = article.childNodes[1].children[0];
    expect(multitag.childNodes[0].textContent).toContain('this is the inner content');
    expect(multitag.childNodes[1].tagName).toBe('DIV');
    expect(multitag.childNodes[1].classList.contains('nested-div-first')).toBeTrue();
    expect(multitag.childNodes[1].textContent).toContain('A nested div');
    expect(multitag.childNodes[2].textContent).toContain('yet more text');
    expect(multitag.childNodes[3].tagName).toBe('DIV');
    expect(multitag.childNodes[3].classList.contains('nested-div-second')).toBeTrue();
    expect(multitag.childNodes[4].textContent).toContain('and a final bit of text');

    const deeplyNestedDiv = multitag.childNodes[3];
    expect(deeplyNestedDiv.childNodes[0].textContent).toContain('And a nested component ');
    expect(deeplyNestedDiv.childNodes[1].tagName).toBe('WHATEVER-ELEMENT');
    expect(deeplyNestedDiv.childNodes[1].querySelector('.whatever-component')).not.toBe(null);
    expect(deeplyNestedDiv.childNodes[2].textContent).toContain('Pretty neat.'); 
  });

  it('#should load string hooks and element hooks side-by-side', () => {
    const div = document.createElement('div')
    div.innerHTML = `
      <section>
        Here should be the first component: 
        <multitag-element>
          And it contains a string hook [singletag-string]. Should work.
        </multitag-element>
        [multitag-string]
          Lets invert the nesting here <whatever-element>Inner content</whatever-element>. Should also work.
        [/multitag-string]
      </section>
    `;

    comp.content = div;
    comp.ngOnChanges({content: true} as any);

    expect(Object.values(comp.hookIndex).length).toBe(4);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[3].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[4].componentRef!.instance.constructor.name).toBe('WhateverTestComponent');

    const section = fixture.nativeElement.children[0];
    expect(section.childNodes[0].textContent).toContain('Here should be the first component');
    expect(section.childNodes[1].tagName).toBe('MULTITAG-ELEMENT');
    expect(section.childNodes[1].children[0].classList.contains('multitag-component')).toBeTrue();

    const elementMultitag = section.childNodes[1].children[0];
    expect(elementMultitag.childNodes[0].textContent).toContain('And it contains a string hook');
    expect(elementMultitag.childNodes[1].tagName).toBe(anchorElementTag.toUpperCase());
    expect(elementMultitag.childNodes[1].children[0].classList.contains('singletag-component')).toBeTrue();
    expect(elementMultitag.childNodes[2].textContent).toContain('Should work');

    expect(section.childNodes[3].tagName).toBe(anchorElementTag.toUpperCase());
    expect(section.childNodes[3].children[0].classList.contains('multitag-component')).toBeTrue();

    const stringMultitag = section.childNodes[3].children[0];
    expect(stringMultitag.childNodes[0].textContent).toContain('Lets invert the nesting here');
    expect(stringMultitag.childNodes[1].tagName).toBe('WHATEVER-ELEMENT');
    expect(stringMultitag.childNodes[1].children[0].classList.contains('whatever-component')).toBeTrue();
    expect(stringMultitag.childNodes[2].textContent).toContain('Should also work');
  });

  it('#should be able to use document.body as content', () => {
    const body = document.createElement('body');
    body.innerHTML = `
      <section>
        <multitag-element>
          This is the inner content.
        </multitag-element>
      </section>
    `;

    comp.content = body;
    comp.ngOnChanges({content: true} as any);

    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');

    const section = fixture.nativeElement.children[0];
    expect(section.children[0].tagName).toBe('MULTITAG-ELEMENT');
    expect(section.children[0].children[0].classList.contains('multitag-component')).toBeTrue();
    expect(section.children[0].children[0].textContent).toContain('This is the inner content.');
  });

  it('#should ignore html structures when looking for string hooks, just parse the pure text', () => {
    const multitagStringParser = TestBed.inject(GenericMultiTagStringParser);
    const hookFinder = TestBed.inject(HookFinder);

    multitagStringParser.onFindHooks = (content, context) => {
      return hookFinder.findEnclosingHooks(content, /<my-custom-element>/g, /<\/my-custom-element>/g);
    };

    const div = document.createElement('div');
    div.innerHTML = `
      <my-custom-element>
        This is the inner content.
      </my-custom-element>
    `;

    comp.content = div;
    comp.options = {sanitize: false};
    comp.ngOnChanges({content: true} as any);

    expect(Object.values(comp.hookIndex).length).toBe(0);
    const customElement = fixture.nativeElement.children[0];
    expect(customElement.tagName).toBe('MY-CUSTOM-ELEMENT');
    expect(customElement.textContent).toContain('This is the inner content.');
  });

  it('#should only look for string hooks if there even are string parsers', () => {
    const stringHookFinder = TestBed.inject(StringHookFinder);
    const genericMultiTagElementParser = TestBed.inject(GenericMultiTagElementParser)
    spyOn(stringHookFinder, 'checkElement').and.callThrough();

    const div = document.createElement('div');
    div.innerHTML = `
      <section>
        <multitag-element>
          This is the inner content.
        </multitag-element>
      </section>
    `;

    comp.content = div;
    comp.parsers = [genericMultiTagElementParser];
    comp.ngOnChanges({content: true} as any);

    expect((stringHookFinder.checkElement as jasmine.Spy).calls.all().length).toBe(0);

    expect(Object.values(comp.hookIndex).length).toBe(1);
    const componentElement = fixture.nativeElement.children[0].children[0];
    expect(componentElement.tagName).toBe('MULTITAG-ELEMENT');
    expect(componentElement.textContent).toContain('This is the inner content.');
  });

  it('#should use passed content element as output element by default', () => {
    const dynHooksService = TestBed.inject(DynamicHooksService);

    const div = document.createElement('div');
    div.innerHTML = `
      <section>
        <multitag-element>
          <span>This is the inner content.</span>
        </multitag-element>
      </section>
    `;

    dynHooksService.parse(div).subscribe(result => {
      expect(result.element).toBe(div);
    });
  });

  it('#should use targetElement as output element if specified, and move child nodes of passed content element over', () => {
    const dynHooksService = TestBed.inject(DynamicHooksService);

    const div = document.createElement('div');
    div.innerHTML = `
      <section>
        <multitag-element>
          This is the inner content.
        </multitag-element>
      </section>
    `;
    const divChild = div.children[0];
    const article = document.createElement('article');

    dynHooksService.parse(div, {}, null, null, null, {sanitize: false}, article).subscribe(result => {
      expect(result.element).toBe(article);
      expect(result.element.children[0]).toBe(divChild);
    });
  });
  
  it('#should disable sanitization by default when passing an element as content', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <section id="someId">
        <custom-element></custom-element>
        <multitag-element>
          This is the inner content.
          <script>
            /* Even with js */
          </script>
        </multitag-element>
      </section>
    `;

    comp.content = div;
    comp.ngOnChanges({content: true} as any);

    expect(Object.values(comp.hookIndex).length).toBe(1);

    const section = fixture.nativeElement.children[0];
    expect(section.getAttribute('id')).toBe('someId');

    const customElement = section.children[0];
    expect(customElement.tagName).toBe('CUSTOM-ELEMENT');

    const multitagElement = section.children[1];
    expect(multitagElement.tagName).toBe('MULTITAG-ELEMENT');
    expect(multitagElement.textContent).toContain('This is the inner content.');

    const scriptElement = multitagElement.children[0].childNodes[1];
    expect(scriptElement).not.toBeUndefined();
  });

  it('#should be not load components twice into the same elements when calling parse again (be idempotent)', async () => {
    const dynHooksService = TestBed.inject(DynamicHooksService);
    const componentCreator = TestBed.inject(ComponentCreator);
    const spy = spyOn(componentCreator, 'init').and.callThrough();

    const contentEl = document.createElement('div');
    contentEl.innerHTML = `
      <article>
        <div>
          <h1>Here is a string hook: [singletag-string]</h1>
        </div>
        <aside>
          <span>And let's load an element hook here</span>
          <multitag-element>
            <p>With a nested hook</p>
            <whatever-element>And deeply-nested content</whatever-element>
          </multitag-element>
        <aside>
      </article>
    `;

    // Checks if the html of the initial three components is loaded
    const expectInitialHTML = (result: ParseResult) => {
      expect(result.element).toBe(contentEl)
      const article = result.element.children[0];
      const div = article.children[0];
      const h1 = div.children[0];
      expect(h1.textContent).toContain('Here is a string hook:');
      const singleTagComponentEl = h1.children[0];
      expect(singleTagComponentEl.tagName).toBe(anchorElementTag.toUpperCase());
      expect(singleTagComponentEl.children[0].classList.contains('singletag-component')).toBeTrue();
      const aside = article.children[1];
      const span = aside.children[0];
      expect(span.textContent).toContain("And let's load an element hook here");
      const multiTagComponentEl = aside.children[1];
      expect(multiTagComponentEl.tagName).toBe('MULTITAG-ELEMENT');
      expect(multiTagComponentEl.children[0].classList.contains('multitag-component')).toBeTrue();
      const p = multiTagComponentEl.children[0].children[0];
      expect(p.textContent).toContain("With a nested hook");
      const whateverComponentEl = multiTagComponentEl.children[0].children[1];
      expect(whateverComponentEl.tagName).toBe('WHATEVER-ELEMENT');
      expect(whateverComponentEl.children[0].classList.contains('whatever-component')).toBeTrue();
      expect(whateverComponentEl.children[0].textContent).toContain('And deeply-nested content');
    }

    const firstResult = await firstValueFrom(dynHooksService.parse(contentEl));

    // Make sure all is as expected
    expect(Object.keys(firstResult.hookIndex).length).toBe(3);
    const firstCompRef = firstResult.hookIndex[1].componentRef!;
    const secondCompRef = firstResult.hookIndex[2].componentRef!;
    const thirdCompRef = firstResult.hookIndex[3].componentRef!;
    expect(firstCompRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(secondCompRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(thirdCompRef.instance.constructor.name).toBe('WhateverTestComponent');
    expectInitialHTML(firstResult);

    // Run again. Hooks should not be found again and nothing should have changed.
    const secondResult = await firstValueFrom(dynHooksService.parse(contentEl));
    expect(Object.keys(spy.calls.mostRecent().args[1]).length).toBe(0); // componentCreator.init should be passed empty hookIndex
    expect(Object.keys(secondResult.hookIndex).length).toBe(0);
    expectInitialHTML(secondResult);

    // Now programmatically add new hook element. Should find it (and only it) on next parse
    const newAnchorEl = document.createElement('multitag-element');
    newAnchorEl.innerHTML = '<span>hello there!</span>';
    contentEl.children[0].appendChild(newAnchorEl);

    const thirdResult = await firstValueFrom(dynHooksService.parse(contentEl));
    expect(Object.keys(spy.calls.mostRecent().args[1]).length).toBe(1);
    expect(Object.keys(thirdResult.hookIndex).length).toBe(1);
    expectInitialHTML(thirdResult);

    const newComponentEl = contentEl.children[0].children[2];
    expect(newComponentEl.tagName).toBe('MULTITAG-ELEMENT');
    expect(newComponentEl.children[0].classList.contains('multitag-component')).toBeTrue();
    expect(newComponentEl.children[0].textContent).toContain('hello there!');
  });

});
