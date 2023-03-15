import { first } from 'rxjs/operators';

// Testing api resources
import { LoadedComponent } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach, prepareTestingModule, testParsers } from './shared';
import { OutletComponentWithProviders } from '../resources/components/OutletComponentWithProviders';
import { ParentTestComponent } from '../resources/components/parentTest/parentTest.c';
import { ChildTestComponent } from '../resources/components/parentTest/childTest/childTest.c';
import { EnclosingCustomParser } from '../resources/parsers/enclosingCustomParser';
import { NgContentTestParser } from '../resources/parsers/ngContentTestParser';
import { NonServiceTestParser } from '../resources/parsers/nonServiceTestParser';
import { NgContentTestComponent } from '../resources/components/ngContentTest/ngContentTest.c';
import { LazyTestComponent } from '../resources/components/lazyTest/lazyTest.c';

describe('Loading dynamic components', () => {
  let testBed;
  let fixture: any;
  let comp: OutletComponentWithProviders;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should load just the text if there are no dynamic components', () => {
    const testText = `
    <div>
      <p>This is a bit of prose. If has no dynamic components in it.</p>
      <p>Hopefully, this does not cause the app to explode.</p>
    </div>
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.innerHTML.trim()).toBe(testText.trim());
    expect(Object.values(comp.hookIndex).length).toBe(0);
  });

  it('#should load a single tag dynamic component', () => {
    const testText = `<p>This p-element has a <span>span-element with a component <dynHooks-singletagtest [stringPropAlias]="'/media/maps/valley_of_the_four_winds.png'" [simpleArray]='["chen stormstout", "nomi"]'></span> within it.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null); // Component has loaded
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
  });

  it('#should load a multi tag dynamic component', () => {
    const testText = `<p>This is a multi tag component <dynHooks-multitagtest>This is the inner content.</dynHooks-multitagtest>.</p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null); // Component has loaded
    expect(fixture.nativeElement.querySelector('.multitag-component').innerHTML.trim()).toBe('This is the inner content.'); // Transcluded content works
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
  });

  it('#should load component hooks without any text surrounding them', () => {
    const testText = `<dynHooks-singletagtest [stringPropAlias]="'/media/maps/valley_of_the_four_winds.png'" [simpleArray]='["chen stormstout", "nomi"]'>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');

    // Try with multitag
    comp.content = `<dynHooks-multitagtest></dynHooks-multitagtest>`;
    comp.ngOnChanges({content: true});

    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');

    // And with a custom parser
    comp.content = 'customhook.';
    comp.parsers = [NonServiceTestParser];
    comp.ngOnChanges({content: true, parsers: true});

    expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
    expect(fixture.nativeElement.children.length).toBe(1);
    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
  });

  it('#should remove components if they fail to load', () => {
    const testText = `<dynHooks-multitagtest>This is the inner content.</dynHooks-multitagtest>`;
    comp.content = testText;
    spyOn(comp['outletService']['componentCreator'], 'createComponent').and.throwError('Test error');
    spyOn(console, 'error');
    comp.ngOnChanges({content: true});

    expect(Object.values(comp.hookIndex).length).toBe(0);
    expect((<any>console.error)['calls'].count()).toBe(1);
  });

  it('#should load child components (with parent providers)', () => {
    const parsersWithParentComponentParser = testParsers.concat([{
      component: ParentTestComponent
    }]);
    ({fixture, comp} = prepareTestingModule(parsersWithParentComponentParser, undefined, [ParentTestComponent, ChildTestComponent]));

    const testText = `
    <p>Here's a normal parent component, which should contain its child component as declared in the template: <dynhooks-parenttest></dynhooks-parenttest></p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    // Check that parent component has loaded correctly
    const parentComponent = comp.hookIndex[1].componentRef.instance;
    expect(fixture.nativeElement.querySelector('.parenttest-component')).not.toBe(null); // Component has loaded
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(parentComponent.constructor.name).toBe('ParentTestComponent');
    expect(parentComponent.blubbService).toEqual({name: 'blubb'});

    // Check that child component has loaded correctly
    const childComponent = parentComponent.childTestComponent;
    expect(fixture.nativeElement.querySelector('.childtest-component')).not.toBe(null); // Component has loaded
    expect(childComponent.constructor.name).toBe('ChildTestComponent');
    expect(childComponent.blubbService).toBe(parentComponent.blubbService);
  });

  it('#should load nested content-components', () => {
    const testText = `
    <p>Some advanced nesting:
      <dynhooks-multitagtest id="'nestedImage-outer'">
        <dynhooks-multitagtest id="'nestedImage-inner-1'">lorem ipsum dolor sit amet
          <dynhooks-singletagtest [stringPropAlias]="'this is the first singletagtest'" [simpleArray]='["testString1", "testString2"]'>
          <dynhooks-multitagtest id="'nestedImage-inner-1-1'">
            here is some deeply nested text
            <dynhooks-inlinetest id="nestedtextbox-inner-bolder" [config]="{prop: true}">some text in bold</dynhooks-inlinetest>
            <span>And an element in between</span>
            <dynhooks-singletagtest>
          </dynhooks-multitagtest>
        </dynhooks-multitagtest>
        <dynhooks-multitagtest id="'nestedImage-inner-2'" [nr]='867'></dynhooks-multitagtest>
      </dynhooks-multitagtest>
    </p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(Object.keys(comp.hookIndex).length).toBe(7);

    const grandParentComponentEl = fixture.nativeElement.children[0].children[0];
    expect(grandParentComponentEl.children[0].className).toBe('multitag-component');

    const parentComponentOneEl = grandParentComponentEl.children[0].children[0];
    const parentComponentTwoEl = grandParentComponentEl.children[0].children[1];
    expect(parentComponentOneEl.children[0].className).toBe('multitag-component');
    expect(parentComponentTwoEl.children[0].className).toBe('multitag-component');
    expect(comp.hookIndex[7].componentRef.instance.nr).toBe(867);

    const childComponentOneEl = parentComponentOneEl.children[0].children[0];
    const childComponentTwoEl = parentComponentOneEl.children[0].children[1];
    expect(childComponentOneEl.children[0].className).toBe('singletag-component');
    expect(childComponentTwoEl.children[0].className).toBe('multitag-component');
    expect(comp.hookIndex[3].componentRef.instance.stringProp).toBe('this is the first singletagtest');
    expect(comp.hookIndex[3].componentRef.instance.simpleArray).toEqual(["testString1", "testString2"]);

    const grandcChildComponentOneEl = childComponentTwoEl.children[0].children[0];
    const spanInBetween = childComponentTwoEl.children[0].children[1];
    const grandcChildComponentTwoEl = childComponentTwoEl.children[0].children[2];
    expect(grandcChildComponentOneEl.children[0].className).toBe('inline-component');
    expect(spanInBetween.textContent).toBe('And an element in between');
    expect(grandcChildComponentTwoEl.children[0].className).toBe('singletag-component');
    expect(comp.hookIndex[5].componentRef.instance.config).toEqual({prop: true});

    expect(Object.values(comp.hookIndex).length).toBe(7);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[3].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[4].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[5].componentRef.instance.constructor.name).toBe('InlineTestComponent');
    expect(comp.hookIndex[6].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[7].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
  });

  it('#should not load incorrectly nested content-components', () => {
    const testText = `<p>Overlapping textboxes: <dynhooks-multitagtest id="'overlapping'">text from multitag<dynhooks-inlinetest id="'overlapping-inner'">text from inline</dynhooks-multitagtest></dynhooks-inlinetest></p>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(Object.values(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.inline-component')).toBe(null);
  });

  it('#should load components at their correct positions', () => {
    const testText = `
    <ul>
      <li>This is the first li-element.</li>
      <li>This is the <dynhooks-inlinetest>second</dynhooks-inlinetest> li-element. It has a component <dynhooks-singletagtest [stringPropAlias]="'/media/maps/azsuna.png'" [simpleArray]='["Farondis"]'> in it. Lets put another component <dynhooks-singletagtest [stringPropAlias]="'/media/maps/suramar.png'" [simpleArray]='["Elisande", "Thalyssra"]'> here.</li>
      <li>This is the third li-element. It has a <a href="https://www.google.de" target="_blank">link</a>.</li>
      <li>
        <span>And this is the last</span>
        <dynhooks-multitagtest [someinput]="{test: true}" (someOutput)="context.var.func($event)">
          <span>element in this test</span>
        </dynhooks-multitagtest>
        <span>that we are looking at.</span>
      </li>
    </ul>`;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    const ul = fixture.nativeElement.children[0];
    const firstLi = ul.children[0];
    expect(firstLi.innerText).toBe('This is the first li-element.');

    const secondLi = ul.children[1];
    expect(secondLi.innerHTML).toContain('This is the <dynhooks-inlinetest');
    expect(secondLi.children[0].children[0].className).toBe('inline-component');
    expect(secondLi.children[0].children[0].innerText.trim()).toBe('second');
    expect(secondLi.innerHTML).toContain('</dynhooks-inlinetest> li-element. It has a component <dynhooks-singletagtest');
    expect(secondLi.children[1].children[0].className).toBe('singletag-component');
    expect(secondLi.innerHTML).toContain('</dynhooks-singletagtest> in it. Lets put another component <dynhooks-singletagtest');
    expect(secondLi.children[2].children[0].className).toBe('singletag-component');
    expect(secondLi.innerHTML).toContain('</dynhooks-singletagtest> here.');

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

  it('#should load custom ng-content properly', () => {
    // Test custom ng-content
    // NgContentTestParser always returns unique hardcoded ngContent for NgContentTestComponent
    // instead of the actual childNodes. Check that this hardcoded content is correctly rendered.

    const parsersWithNgContentParser = testParsers.concat([NgContentTestParser]);
    ({fixture, comp} = prepareTestingModule(parsersWithNgContentParser, undefined, [NgContentTestComponent]));
    const testText = `<dynhooks-ngcontenttest><p>original content</p><dynhooks-singletagtest></dynhooks-ngcontenttest>`;
    comp.content = testText;
    comp.context = {};
    comp.ngOnChanges({content: true, context: context});

    // Inner component should be removed
    expect(Object.keys(comp.hookIndex).length).toBe(1);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('NgContentTestComponent');

    // Make sure that <ng-content> slots of NgContentComponent are correctly filled out
    const componentElement = fixture.nativeElement.children[0];
    const firstContentContainer = componentElement.children[0].children[0].children[1];
    const secondContentContainer = componentElement.children[0].children[1].children[1];
    const thirdContentContainer = componentElement.children[0].children[2].children[1];

    expect(firstContentContainer.innerHTML.trim()).toBe('<span>this should be highlighted</span>');                    // Should replace normal child nodes
    expect(secondContentContainer.innerHTML.trim()).toBe('');                                                          // Intentionally skipped this ngContent-index
    expect(thirdContentContainer.innerHTML.trim()).toBe('<h2>This is the title</h2><div>Some random content</div>');   // Should have two elements
  });

  it('#should trigger ngOnInit() after component creation', () => {
    const testText = `Just some component: <dynhooks-singletagtest>`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});

    const loadedComp = comp.hookIndex[1].componentRef.instance;
    expect(loadedComp.ngOnInitTriggered).toBe(true);
  });

  it('#should trigger ngOnChanges() after component creation and any time an input changes', () => {
    const testText = `Just some component: <dynhooks-singletagtest [numberProp]="context.order">`;
    comp.content = testText;
    comp.context = context;
    comp.options = {updateOnPushOnly: false};
    comp.ngOnChanges({content: true, context: true, options: true});

    const loadedComp = comp.hookIndex[1].componentRef.instance;
    expect(loadedComp.ngOnChangesTriggered).toBe(true);
    expect(loadedComp.numberProp).toBe(66);

    // Change bound input and expect ngOnChanges to trigger
    spyOn(loadedComp, 'ngOnChanges').and.callThrough();
    context.order = 77;
    comp.ngDoCheck();

    expect(loadedComp.numberProp).toBe(77);
    expect(loadedComp.ngOnChanges['calls'].count()).toBe(1);
  });

  it('#should correctly trigger onDynamicMount() on init', () => {
    const testText = `
    <dynhooks-multitagtest id="outercomp">
      bla bla
      <dynhooks-singletagtest>
      <p>some<b>text</b></p>
      <div>
        <dynhooks-multitagtest id="innercomp">
          <dynhooks-singletagtest>
          <div data-attribute-level1>
            <div data-attribute-level1>
              <dynhooks-inlinetest></dynhooks-inlinetest>
            </div>
            <dynhooks-singletagtest>
          </div>
          yada yada
          <ul>
            <li>first li</li>
            <li>second li with <dynhooks-inlinetest></dynhooks-inlinetest></li>
            <li>third li</li>
          </ul>
        </dynhooks-multitagtest>
      </div>
    </dynhooks-multitagtest>`;

    comp.content = testText;
    comp.context = context;
    comp.parsers = [...testParsers, EnclosingCustomParser];
    comp.ngOnChanges({content: true, parsers: true, context: true});

    // Denoting level of nestedness with number prefix here
    const one_multiTagComp = comp.hookIndex[1].componentRef.instance;
    const two_singleTagComp = comp.hookIndex[2].componentRef.instance;
    const two_multiTagComp = comp.hookIndex[3].componentRef.instance;
    const three_singleTagComp = comp.hookIndex[4].componentRef.instance;
    const three_customComp = comp.hookIndex[5].componentRef.instance;
    const four_customComp = comp.hookIndex[6].componentRef.instance;
    const four_singleTagComp = comp.hookIndex[7].componentRef.instance;
    const five_inlineComp = comp.hookIndex[8].componentRef.instance;
    const three_inlineComp = comp.hookIndex[9].componentRef.instance;

    // Context should have been passed in
    expect(one_multiTagComp.mountContext).toEqual(context);
    expect(two_singleTagComp.mountContext).toEqual(context);
    expect(two_multiTagComp.mountContext).toEqual(context);
    expect(three_singleTagComp.mountContext).toEqual(context);
    expect(three_customComp.mountContext).toEqual(context);
    expect(four_customComp.mountContext).toEqual(context);
    expect(four_singleTagComp.mountContext).toEqual(context);
    expect(five_inlineComp.mountContext).toEqual(context);
    expect(three_inlineComp.mountContext).toEqual(context);

    // Content children should have been generated and passed into all loaded components
    // Test each individually (all the way down)
    expect(one_multiTagComp.mountContentChildren.length).toBe(2);
    expect(one_multiTagComp.mountContentChildren[0].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[0].componentSelector).toBe('dynhooks-singletagtest');
    expect(one_multiTagComp.mountContentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-singletagtest>', closingTag: null});
    expect(one_multiTagComp.mountContentChildren[0].contentChildren.length).toBe(0);
    expect(one_multiTagComp.mountContentChildren[1].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].componentSelector).toBe('dynhooks-multitagtest');
    expect(one_multiTagComp.mountContentChildren[1].hookValue).toEqual({openingTag: '<dynhooks-multitagtest id="innercomp">', closingTag: '</dynhooks-multitagtest>'});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren.length).toBe(3);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[0].componentSelector).toBe('dynhooks-singletagtest');
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[0].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-singletagtest>', closingTag: null});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren.length).toBe(0);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].componentSelector).toBe('dynhooks-multitagtest');
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].hookValue).toEqual({openingTag: '<div data-attribute-level1>', closingTag: '</div>'});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren.length).toBe(2);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].componentSelector).toBe('dynhooks-multitagtest');
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].hookValue).toEqual({openingTag: '<div data-attribute-level1>', closingTag: '</div>'});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren.length).toBe(1);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren[0].componentSelector).toBe('dynhooks-inlinetest');
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren[0].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-inlinetest>', closingTag: '</dynhooks-inlinetest>'});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[0].contentChildren[0].contentChildren.length).toBe(0);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[1].componentSelector).toBe('dynhooks-singletagtest');
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[1].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[1].hookValue).toEqual({openingTag: '<dynhooks-singletagtest>', closingTag: null});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren[1].contentChildren.length).toBe(0);
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[2].componentSelector).toBe('dynhooks-inlinetest');
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[2].componentRef).toBeDefined();
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[2].hookValue).toEqual({openingTag: '<dynhooks-inlinetest>', closingTag: '</dynhooks-inlinetest>'});
    expect(one_multiTagComp.mountContentChildren[1].contentChildren[2].contentChildren.length).toBe(0);

    expect(two_singleTagComp.mountContentChildren.length).toBe(0);

    expect(two_multiTagComp.mountContentChildren.length).toBe(3);
    expect(two_multiTagComp.mountContentChildren[0].componentSelector).toBe('dynhooks-singletagtest');
    expect(two_multiTagComp.mountContentChildren[0].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-singletagtest>', closingTag: null});
    expect(two_multiTagComp.mountContentChildren[0].contentChildren.length).toBe(0);
    expect(two_multiTagComp.mountContentChildren[1].componentSelector).toBe('dynhooks-multitagtest');
    expect(two_multiTagComp.mountContentChildren[1].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[1].hookValue).toEqual({openingTag: '<div data-attribute-level1>', closingTag: '</div>'});
    expect(two_multiTagComp.mountContentChildren[1].contentChildren.length).toBe(2);
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].componentSelector).toBe('dynhooks-multitagtest');
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].hookValue).toEqual({openingTag: '<div data-attribute-level1>', closingTag: '</div>'});
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren.length).toBe(1);
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren[0].componentSelector).toBe('dynhooks-inlinetest');
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren[0].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-inlinetest>', closingTag: '</dynhooks-inlinetest>'});
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[0].contentChildren[0].contentChildren.length).toBe(0);
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[1].componentSelector).toBe('dynhooks-singletagtest');
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[1].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[1].hookValue).toEqual({openingTag: '<dynhooks-singletagtest>', closingTag: null});
    expect(two_multiTagComp.mountContentChildren[1].contentChildren[1].contentChildren.length).toBe(0);
    expect(two_multiTagComp.mountContentChildren[2].componentSelector).toBe('dynhooks-inlinetest');
    expect(two_multiTagComp.mountContentChildren[2].componentRef).toBeDefined();
    expect(two_multiTagComp.mountContentChildren[2].hookValue).toEqual({openingTag: '<dynhooks-inlinetest>', closingTag: '</dynhooks-inlinetest>'});
    expect(two_multiTagComp.mountContentChildren[2].contentChildren.length).toBe(0);

    expect(three_singleTagComp.mountContentChildren.length).toBe(0);

    expect(three_customComp.mountContentChildren.length).toBe(2);
    expect(three_customComp.mountContentChildren[0].componentSelector).toBe('dynhooks-multitagtest');
    expect(three_customComp.mountContentChildren[0].componentRef).toBeDefined();
    expect(three_customComp.mountContentChildren[0].hookValue).toEqual({openingTag: '<div data-attribute-level1>', closingTag: '</div>'});
    expect(three_customComp.mountContentChildren[0].contentChildren.length).toBe(1);
    expect(three_customComp.mountContentChildren[0].contentChildren[0].componentSelector).toBe('dynhooks-inlinetest');
    expect(three_customComp.mountContentChildren[0].contentChildren[0].componentRef).toBeDefined();
    expect(three_customComp.mountContentChildren[0].contentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-inlinetest>', closingTag: '</dynhooks-inlinetest>'});
    expect(three_customComp.mountContentChildren[0].contentChildren[0].contentChildren.length).toBe(0);
    expect(three_customComp.mountContentChildren[1].componentSelector).toBe('dynhooks-singletagtest');
    expect(three_customComp.mountContentChildren[1].componentRef).toBeDefined();
    expect(three_customComp.mountContentChildren[1].hookValue).toEqual({openingTag: '<dynhooks-singletagtest>', closingTag: null});
    expect(three_customComp.mountContentChildren[1].contentChildren.length).toBe(0);

    expect(four_customComp.mountContentChildren.length).toBe(1);
    expect(four_customComp.mountContentChildren[0].componentSelector).toBe('dynhooks-inlinetest');
    expect(four_customComp.mountContentChildren[0].componentRef).toBeDefined();
    expect(four_customComp.mountContentChildren[0].hookValue).toEqual({openingTag: '<dynhooks-inlinetest>', closingTag: '</dynhooks-inlinetest>'});
    expect(four_customComp.mountContentChildren[0].contentChildren.length).toBe(0);

    expect(four_singleTagComp.mountContentChildren.length).toBe(0);

    expect(five_inlineComp.mountContentChildren.length).toBe(0);

    expect(three_inlineComp.mountContentChildren.length).toBe(0);
  });

  it('#should correctly trigger onDynamicChanges() on context reference change', () => {
    const testText = `<dynhooks-singletagtest>`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});
    const loadedComp = comp.hookIndex[1].componentRef.instance;
    spyOn(loadedComp, 'onDynamicChanges').and.callThrough();
    spyOn(comp['componentUpdater'], 'refresh').and.callThrough();

    // Should be set from initial call
    expect(loadedComp.changesContext).toEqual(context);

    // Shouldn't be called again when context property changes...
    comp.context.order = 77;
    comp.ngDoCheck();
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(1);
    expect(loadedComp.onDynamicChanges['calls'].count()).toBe(0);

    // ...only when context object changes by reference
    const newContext = {newProps: [1, 2, 3, 'something']};
    comp.context = newContext;
    comp.ngOnChanges({context: true});
    expect(comp['componentUpdater'].refresh['calls'].count()).toBe(2);
    expect(loadedComp.onDynamicChanges['calls'].count()).toBe(1);
    expect(loadedComp.changesContext).toEqual(newContext);
  });

  it('#should activate change detection for dynamically loaded components', () => {
    const testText = `<dynhooks-singletagtest [numberProp]="context.order">`;
    comp.content = testText;
    comp.context = context;
    comp.ngOnChanges({content: true, context: true});

    // Change detection should have run in all components
    expect(fixture.nativeElement.querySelector('.singletag-nr').textContent).toBe('66');

    // Change bound variable
    comp.context.order = 77;

    // Trigger cd
    fixture.detectChanges();

    // Should have updated
    expect(fixture.nativeElement.querySelector('.singletag-nr').textContent).toBe('77');

  });

  it('#should activate dependency injection for dynamically loaded components', () => {
    const testText = `
    <p>
      This is the first component: <dynhooks-singletagtest>.
      This is the second component: <dynhooks-multitagtest></dynhooks-multitagtest>.
    </p>
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(Object.keys(comp.hookIndex).length).toEqual(2);
    const firstComp = comp.hookIndex[1].componentRef.instance;
    const secondComp = comp.hookIndex[2].componentRef.instance;

    // Should be loaded in both
    expect(firstComp['cd']).not.toBeFalsy();
    expect(secondComp['cd']).not.toBeFalsy();
    expect(firstComp['testService']['someString']).toBe('The TestService has loaded!');
    expect(secondComp['testService']['someString']).toBe('The TestService has loaded!');

    // Change value in service
    firstComp['testService']['someString'] = 'Value has changed!';

    // Should be reflected in both
    expect(firstComp['testService']['someString']).toBe('Value has changed!');
    expect(secondComp['testService']['someString']).toBe('Value has changed!');
  });

  it('#should trigger componentsLoaded when all components have loaded', () => {
    const testText = `
      <p>Let's load a couple of components like</p>
      <dynhooks-singletagtest [stringPropAlias]="'some random sentence'">
      <dynhooks-multitagtest [nr]="99">
        <dynhooks-inlinetest [nr]="1000"></dynhooks-inlinetest>
      </dynHooks-multitagtest>
      <p>Really cool stuff.</p>
    `;

    comp.content = testText;
    let loadedComponents: LoadedComponent[] = [];
    comp.componentsLoaded.pipe(first()).subscribe((lc: any) => loadedComponents = lc);
    comp.ngOnChanges({content: true});

    expect(Object.values(comp.hookIndex).length).toBe(3);
    expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(comp.hookIndex[3].componentRef.instance.constructor.name).toBe('InlineTestComponent');

    // componentsLoaded should have triggered
    expect(loadedComponents.length).toBe(3);

    expect(loadedComponents[0].hookId).toBe(1);
    expect(loadedComponents[0].hookValue as any).toEqual({openingTag: `<dynhooks-singletagtest [stringPropAlias]="'some random sentence'">`, closingTag: null});
    expect(loadedComponents[0].hookParser).toBeDefined();
    expect(loadedComponents[0].componentRef.instance.stringProp).toBe('some random sentence');

    expect(loadedComponents[1].hookId).toBe(2);
    expect(loadedComponents[1].hookValue).toEqual({openingTag: `<dynhooks-multitagtest [nr]="99">`, closingTag: `</dynHooks-multitagtest>`});
    expect(loadedComponents[1].hookParser).toBeDefined();
    expect(loadedComponents[1].componentRef.instance.nr).toBe(99);

    expect(loadedComponents[2].hookId).toBe(3);
    expect(loadedComponents[2].hookValue).toEqual({openingTag: `<dynhooks-inlinetest [nr]="1000">`, closingTag: `</dynhooks-inlinetest>`});
    expect(loadedComponents[2].hookParser).toBeDefined();
    expect(loadedComponents[2].componentRef.instance.nr).toBe(1000);
  });

  it('#should lazy-load components', (done) => {
    const parsersWithLazyParser = testParsers.concat([{
      component: {
        importPromise: () => import('../resources/components/lazyTest/lazyTest.c'),
        importName: 'LazyTestComponent'
      },
      name: 'lazyParser',
      selector: 'dynhooks-lazytest'
    }]);
    ({fixture, comp} = prepareTestingModule(parsersWithLazyParser, undefined, [LazyTestComponent]));
    const testText = `
      <p>
        A couple of components:
        <dynhooks-singletagtest [stringPropAlias]="'something'">
        <dynhooks-multitagtest [nr]="4">
          <dynhooks-lazytest [name]="'sleepy'"></dynhooks-lazytest>
        </dynHooks-multitagtest>
        <dynhooks-inlinetest [nr]="87"></dynhooks-inlinetest>
      </p>
    `;

    comp.content = testText;
    comp.context = context;
    let loadedComponents: LoadedComponent[] = [];
    comp.componentsLoaded.pipe(first()).subscribe((lc: any) => loadedComponents = lc);
    comp.ngOnChanges({content: true, context: true});

    // Only run this test if ng-version is 9+ (ivy enabled)
    const versionElement = document.querySelector('[ng-version]');
    const versionAttr = versionElement ? versionElement.getAttribute('ng-version') : null;
    const version = versionAttr !== null ? parseInt(versionAttr, 10) : null;
    if (version && version < 9) {
      expect(true).toBe(true);
      done();
    } else {

      // Everything except the lazy-loaded component should be loaded
      expect(fixture.nativeElement.querySelector('.singletag-component')).not.toBe(null);
      expect(fixture.nativeElement.querySelector('.multitag-component')).not.toBe(null);
      expect(fixture.nativeElement.querySelector('.inline-component')).not.toBe(null);
      expect(fixture.nativeElement.querySelector('.lazy-component')).toBe(null);
      expect(fixture.nativeElement.querySelector('dynamic-component-anchor')).not.toBe(null);

      expect(Object.values(comp.hookIndex).length).toBe(4);
      expect(comp.hookIndex[1].componentRef.instance.constructor.name).toBe('SingleTagTestComponent');
      expect(comp.hookIndex[2].componentRef.instance.constructor.name).toBe('MultiTagTestComponent');
      expect(comp.hookIndex[3].componentRef).toBeNull();
      expect(comp.hookIndex[4].componentRef.instance.constructor.name).toBe('InlineTestComponent');

      // Make sure that onDynamicChanges has triggered on component init
      spyOn(comp.hookIndex[2].componentRef.instance, 'onDynamicChanges').and.callThrough();
      expect(comp.hookIndex[2].componentRef.instance.onDynamicChanges['calls'].count()).toBe(0);
      expect(comp.hookIndex[2].componentRef.instance.changesContext).toEqual(context);
      expect(comp.hookIndex[2].componentRef.instance.changesContentChildren).toBeUndefined();

      // Make sure that onDynamicMount has not yet triggered
      spyOn(comp.hookIndex[2].componentRef.instance, 'onDynamicMount').and.callThrough();
      expect(comp.hookIndex[2].componentRef.instance.onDynamicMount['calls'].count()).toBe(0);
      expect(comp.hookIndex[2].componentRef.instance.mountContext).toBeUndefined();
      expect(comp.hookIndex[2].componentRef.instance.mountContentChildren).toBeUndefined();

      // Also, componentsLoaded should not yet have triggered
      expect(loadedComponents).toEqual([]);

      // Have to manually wait. Neither tick() nor fixture.whenStable() seems to wait for dynamic imports
      setTimeout(() => {
        // Lazy-loaded component should be loaded by now in anchor
        expect(fixture.nativeElement.querySelector('.lazy-component')).not.toBe(null);
        expect(fixture.nativeElement.querySelector('dynamic-component-anchor')).not.toBe(null);
        expect(fixture.nativeElement.querySelector('dynamic-component-anchor').classList[0]).toBe('dynhooks-lazytest-anchor');    // Anchor should have comp class
        expect(fixture.nativeElement.querySelector('dynamic-component-anchor').childNodes[0].tagName).toBe('DYNHOOKS-LAZYTEST');  // Selector element should be loaded in anchor
        expect(comp.hookIndex[3].componentRef.instance.constructor.name).toBe('LazyTestComponent');
        expect(comp.hookIndex[3].componentRef.instance.name).toBe('sleepy');

        // Make sure that onDynamicChanges has triggered again (with contentChildren)
        expect(comp.hookIndex[2].componentRef.instance.onDynamicChanges['calls'].count()).toBe(1);
        expect(comp.hookIndex[2].componentRef.instance.changesContext).toEqual(context);
        expect(comp.hookIndex[2].componentRef.instance.changesContentChildren.length).toBe(1);
        expect(comp.hookIndex[2].componentRef.instance.changesContentChildren[0].componentSelector).toBe('dynhooks-lazytest');

        // Make sure that onDynamicMount has triggered
        expect(comp.hookIndex[2].componentRef.instance.onDynamicMount['calls'].count()).toBe(1);
        expect(comp.hookIndex[2].componentRef.instance.mountContext).toEqual(context);
        expect(comp.hookIndex[2].componentRef.instance.mountContentChildren.length).toBe(1);
        expect(comp.hookIndex[2].componentRef.instance.mountContentChildren[0].componentSelector).toBe('dynhooks-lazytest');

        // ComponentsLoaded should have emitted now and contain the lazy-loaded component
        expect(loadedComponents.length).toBe(4);

        expect(loadedComponents[0].hookId).toBe(1);
        expect(loadedComponents[0].hookValue as any).toEqual({openingTag: `<dynhooks-singletagtest [stringPropAlias]="'something'">`, closingTag: null});
        expect(loadedComponents[0].hookParser).toBeDefined();
        expect(loadedComponents[0].componentRef.instance.stringProp).toBe('something');

        expect(loadedComponents[1].hookId).toBe(2);
        expect(loadedComponents[1].hookValue).toEqual({openingTag: `<dynhooks-multitagtest [nr]="4">`, closingTag: `</dynHooks-multitagtest>`});
        expect(loadedComponents[1].hookParser).toBeDefined();
        expect(loadedComponents[1].componentRef.instance.nr).toBe(4);

        expect(loadedComponents[2].hookId).toBe(3);
        expect(loadedComponents[2].hookValue).toEqual({openingTag: `<dynhooks-lazytest [name]="'sleepy'">`, closingTag: `</dynhooks-lazytest>`});
        expect(loadedComponents[2].hookParser).toBeDefined();
        expect(loadedComponents[2].componentRef.instance.name).toBe('sleepy');

        expect(loadedComponents[3].hookId).toBe(4);
        expect(loadedComponents[3].hookValue).toEqual({openingTag: `<dynhooks-inlinetest [nr]="87">`, closingTag: `</dynhooks-inlinetest>`});
        expect(loadedComponents[3].hookParser).toBeDefined();
        expect(loadedComponents[3].componentRef.instance.nr).toBe(87);

        done();
      }, 100);
    }
  });

  it('#should destroy loaded components when destroyed itself', () => {
    const testText = `
      <dynhooks-singletagtest [stringPropAlias]="'This is the first loaded component'">
      <dynhooks-multitagtest></dynhooks-multitagtest>
    `;
    comp.content = testText;
    comp.ngOnChanges({content: true});

    expect(Object.keys(comp.hookIndex).length).toBe(2);
    const firstCompRef = comp.hookIndex[1].componentRef;
    const secondCompRef = comp.hookIndex[2].componentRef;
    spyOn(firstCompRef, 'destroy').and.callThrough();
    spyOn(secondCompRef, 'destroy').and.callThrough();

    expect(firstCompRef.instance.constructor.name).toBe('SingleTagTestComponent');
    expect(secondCompRef.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(firstCompRef.instance.stringProp).toBe('This is the first loaded component');
    expect((firstCompRef as any).destroy['calls'].count()).toBe(0);
    expect((secondCompRef as any).destroy['calls'].count()).toBe(0);

    // Destroy outlet comnponent
    comp.ngOnDestroy();

    expect(fixture.nativeElement.innerHTML).toBe('');
    expect(Object.keys(comp.hookIndex).length).toBe(0);
    expect((firstCompRef as any).destroy['calls'].count()).toBe(1);
    expect((secondCompRef as any).destroy['calls'].count()).toBe(1);
  });
});
