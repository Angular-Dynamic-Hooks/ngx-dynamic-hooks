// Testing api resources
import { anchorElementTag, DynamicHooksComponent } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule } from './shared';
import { TestBed } from '@angular/core/testing';
import { GenericMultiTagStringParser } from '../resources/parsers/genericMultiTagStringParser';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';


describe('DynamicHooksComponent', () => {
  let testBed: TestBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });
  
  
  // Initialize DynamicHookComponent
  // -------------------------------------------------------------

  it('#should work without calling provideDynamicHooks', () => {
    ({comp} = prepareTestingModule(() => []));

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

    comp.content = testText;
    comp.parsers = parsers;
    comp.ngOnChanges({content: true} as any);
    
    const hookIndex = comp.hookIndex;
    const rootElement = comp['hostElement'].nativeElement;

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
    expect(singletagStringComp.tagName).toBe('SINGLETAG-STRING-SELECTOR');
    expect(singletagStringComp.children[0].classList.contains('singletag-component')).toBe(true);
    const secondP = section.children[1];
    expect(secondP.childNodes[0].textContent).toBe('And here is a multitag component');
    const multitagStringComp = section.children[2];
    expect(multitagStringComp.tagName).toBe('MULTITAG-STRING-SELECTOR');
    expect(multitagStringComp.children[0].classList.contains('multitag-component')).toBe(true);
    const span = multitagStringComp.children[0].children[0];
    expect(span.textContent).toBe('The first inner content');
    const multitagElementComp = multitagStringComp.children[0].children[1];
    expect(multitagElementComp.tagName).toBe('MULTITAG-ELEMENT-SELECTOR');
    expect(multitagElementComp.children[0].classList.contains('multitag-component')).toBe(true);
    const blockquote = multitagElementComp.children[0].children[0];
    expect(blockquote.textContent).toBe('And the second inner content');
  });

  it('#should have created the main component correctly', () => {
    expect(comp).toBeDefined();
  });

  it('#should call DynamicHooksService to parse components', () => {
    expect(comp).toBeDefined();
    spyOn(comp, 'parse').and.callThrough();
    spyOn(comp['dynamicHooksService'], 'parse').and.callThrough();

    comp.ngOnChanges({content: true} as any);

    expect((comp.parse as any)['calls'].count()).toBe(1);
    expect((comp['dynamicHooksService'].parse as any)['calls'].count()).toBe(1);
  });

  it('#should call DynamicHooksService to destroy all dynamic components when destroyed itself', () => {
    expect(comp).toBeDefined();
    spyOn(comp, 'parse').and.callThrough();
    spyOn(comp['dynamicHooksService'], 'destroy').and.callThrough();

    comp.ngOnDestroy();

    expect((comp['dynamicHooksService'].destroy as any)['calls'].count()).toBe(1);
  });

  it('#should reset and reload when relevant bindings change', () => {
    spyOn(comp, 'parse').and.callThrough();
    spyOn(comp, 'reset').and.callThrough();

    // Initialize
    const testTextOne = `<div>Some random component [multitag-string]with inner content.[/multitag-string]></div>`;
    comp.content = testTextOne;
    comp.ngOnChanges({content: true} as any);
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.parse as any)['calls'].count()).toBe(1);

    // Change 'content'
    const testTextTwo = `<span>Some other text [singletag-string][multitag-string][/multitag-string]</span>`;
    comp.content = testTextTwo;
    comp.ngOnChanges({content: true} as any);
    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(Object.values(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.parse as any)['calls'].count()).toBe(2);

    // Change 'options'
    const newOptions = {sanitize: false};
    comp.options = newOptions;
    comp.ngOnChanges({options: true} as any);
    expect((comp.parse as any)['calls'].count()).toBe(3);

    // Change 'globalParsersBlacklist'
    const blacklist = ['GenericSingleTagStringParser'];
    comp.globalParsersBlacklist = blacklist;
    comp.ngOnChanges({globalParsersBlacklist: true} as any);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp.parse as any)['calls'].count()).toBe(4);

    // Reset
    (comp as any).globalParsersBlacklist  = null;
    (comp as any).globalParsersWhitelist = null;
    comp.ngOnChanges({globalParsersBlacklist: true, globalParsersWhitelist: true} as any);
    expect(Object.values(comp.hookIndex).length).toBe(2);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect((comp as any).parse['calls'].count()).toBe(5);

    // Change 'globalParsersWhitelist'
    const whitelist = ['GenericSingleTagStringParser'];
    comp.globalParsersWhitelist = whitelist;
    comp.ngOnChanges({globalParsersWhitelist: true} as any);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('SingleTagTestComponent');
    expect((comp as any).parse['calls'].count()).toBe(6);

    // Change 'parsers' (while leaving 'globalParsersWhitelist' as is, should be ignored)
    comp.parsers = [GenericMultiTagStringParser];
    comp.ngOnChanges({parsers: true} as any);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.activeParsers.length).toBe(1);
    expect(comp.activeParsers[0]).toEqual(jasmine.any(GenericMultiTagStringParser));
    expect((comp as any).activeParsers[0].component.prototype.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.activeParsers[0]['name']).toBe('GenericMultiTagStringParser');
    expect((comp as any).parse['calls'].count()).toBe(7);
  });

});