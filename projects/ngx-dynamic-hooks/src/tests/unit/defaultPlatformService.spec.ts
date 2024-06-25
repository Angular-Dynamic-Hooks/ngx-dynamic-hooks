import { TestBed } from '@angular/core/testing';
import { DefaultPlatformService } from '../testing-api';
import { EmptyTestComponent } from '../resources/components/emptyTest/emptyTest.c';

describe('DefaultPlatformService', () => {
  let platformService: DefaultPlatformService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        DefaultPlatformService
      ]
    });

    platformService = TestBed.inject(DefaultPlatformService);
  });

  // getNgVersion
  // ------------------

  it(`#should return Angular version of the document`, () => {
    const comp = TestBed.createComponent(EmptyTestComponent);

    const ngVersion = '9.0';
    const expectedNgversion = parseInt(ngVersion, 10);

    comp.nativeElement.setAttribute('ng-version', ngVersion);

    const actualNgVersion = platformService.getNgVersion();

    expect(actualNgVersion).toBe(expectedNgversion);
  });

  it(`#should return null as Angular version there's no ng-version`, () => {
    const comp = TestBed.createComponent(EmptyTestComponent);

    comp.nativeElement.removeAttribute('ng-version');

    const actualNgVersion = platformService.getNgVersion();

    expect(actualNgVersion).toBeNull();
  });

  // sanitize
  // ------------------

  it(`#should call the sanitizer to sanitize an element`, () => {
    const testText = `<div>Child1</div>`;
    const expectedResult = 'SANITIZED';

    spyOn(platformService['sanitizer'], 'sanitize').and.returnValue(expectedResult);

    const actualResult = platformService.sanitize(testText);

    expect(actualResult).toBe(expectedResult);
  });

  // createElement
  // ------------------

  it(`#should be able to create elements`, () => {
    const element = platformService.createElement('p');
    expect(element).toBeInstanceOf(Element);
    expect(element.tagName).toBe('P');
  });

  // sortElements
  // ------------------

  it(`#should be able to sort elements`, () => {
    const parentDiv = document.createElement('div');
    const childA = document.createElement('div');
    const childB = document.createElement('div');

    // A before B
    parentDiv.appendChild(childA);
    parentDiv.appendChild(childB);
    let order = platformService.sortElements(childA, childB);
    expect(order).toBe(-1);

    // Reset
    while (parentDiv.firstChild) { parentDiv.removeChild(parentDiv.firstChild) }

    // B before A
    parentDiv.appendChild(childB);
    parentDiv.appendChild(childA);
    order = platformService.sortElements(childA, childB);
    expect(order).toBe(1);

    // Reset
    while (parentDiv.firstChild) { parentDiv.removeChild(parentDiv.firstChild) }

    // Identical
    parentDiv.appendChild(childA);
    order = platformService.sortElements(childA, childA);
    expect(order).toBe(0);
  });

  // getTagName
  // ------------------

  it(`#should return the element's tag name`, () => {
    const expectedTagName = 'DIV';

    const element = document.createElement(expectedTagName);

    const actualTagName = platformService.getTagName(element);

    expect(actualTagName).toBe(expectedTagName);
  });

  // getAttributeNames
  // ------------------

  it('#should return all attribute names', () => {
    const element = document.createElement('div');
    element.innerHTML = `
    <div
      id='asd'
      class="asd"
      href="asd"
      src="asd"
      style="color: blue"
      customattr="asd"
      [inputattr]="asd"
      (outputattr)="asd"
    ></div>
    `;

    const attrNames = platformService.getAttributeNames(element.children[0]);
    expect(attrNames).toEqual(['id', 'class', 'href', 'src', 'style', 'customattr', '[inputattr]', '(outputattr)']);
  });

  // getAttribute
  // ------------------

  it('#should return attribute value by given attribute name', () => {
    const attrName = 'testattr';
    const attrValue = 'TEST_VALUE';

    const element = document.createElement('div');
    element.setAttribute(attrName, attrValue);

    const result = platformService.getAttribute(element, attrName);

    expect(result).toBe(attrValue);
  });

  it('#should return null when attribute does not exist', () => {
    const attrName = 'testattr';
    const attrValue = 'TEST_VALUE';
    const wrongAttrName = 'testattr1';

    const element = document.createElement('div');
    element.setAttribute(attrName, attrValue);

    const result = platformService.getAttribute(element, wrongAttrName);

    expect(result).toBeNull();
  });

  // setAttribute
  // ------------------

  it('#should set attributes according to value', () => {
    const attrName = 'testattr';
    const attrValue = 'TEST_VALUE';

    const element = document.createElement('div');
    platformService.setAttribute(element, attrName, attrValue);

    expect(element.getAttribute(attrName)).toBe(attrValue);
  });

  // removeAttribute
  // ------------------

  it('#should remove attributes according to name', () => {
    const attrName = 'testattr';
    const attrValue = 'TEST_VALUE';

    const element = document.createElement('div');
    element.setAttribute(attrName, attrValue);
    expect(element.hasAttribute(attrName)).toBe(true);

    platformService.removeAttribute(element, attrName);

    expect(element.hasAttribute(attrName)).toBe(false);
  });

  // getParentNode
  // ------------------

  it(`#should return parent node an element`, () => {
    const testText = `<div>Child1</div>`;

    const parent = document.createElement('div');
    parent.innerHTML = testText;
    const child = parent.firstChild;

    const actualParent = platformService.getParentNode(child as any);

    expect(actualParent).not.toBeNull();
    expect(actualParent).toBe(parent);
  });

  it(`#should return null as parent when child node is null`, () => {
    const actualParent = platformService.getParentNode(null as any);

    expect(actualParent).toBeNull();
  });

  // querySelectorAll
  // ------------------
  
  it(`#should be able to use css selectors`, () => {
    const testContent = `
      <div>
        <h1>Hello!</h1>
        <div class='text'>
          <p class="paragraph first"></p>
          <p class="paragraph second"></p>
          <p class="paragraph third"></p>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = testContent;

    const foundElements = platformService.querySelectorAll(element, '.text > .paragraph:nth-child(2)');

    expect(foundElements.length).toBe(1);
    expect(foundElements[0].classList.contains('second')).toBe(true);
  });

  // getChildNodes
  // ------------------

  it('#should return child nodes of an element', () => {
    const testText = `<div>Child1</div><div>Child2</div><div>Child3</div>`

    const element = document.createElement('div');
    element.innerHTML = testText;

    const childNodes = platformService.getChildNodes(element);

    expect(childNodes).not.toBeNull();
    expect(childNodes.length).toBe(3);
    expect(childNodes[0].textContent).toBe('Child1');
    expect(childNodes[1].textContent).toBe('Child2');
    expect(childNodes[2].textContent).toBe('Child3');
  });

  it('#should return empty array as child nodes when there is no child node', () => {
    const element = document.createElement('div');

    const childNodes = platformService.getChildNodes(element);

    expect(childNodes).not.toBeNull();
    expect(childNodes.length).toBe(0);
  });

  // appendChild
  // ------------------

  it('#should be able to append child nodes', () => {
    const parent = document.createElement('div');
    const child = document.createElement('div');

    platformService.appendChild(parent, child);

    expect(parent.childNodes.length).toBe(1);
    expect(parent.childNodes[0]).toBe(child);
  });

  // insertBefore
  // ------------------

  it('#should be able to insert child nodes before others', () => {
    const parent = document.createElement('div');
    const firstChild = document.createElement('div');
    const secondChild = document.createElement('div');
    const thirdChild = document.createElement('div');
    const newChild = document.createElement('div');

    parent.appendChild(firstChild);
    parent.appendChild(secondChild);
    parent.appendChild(thirdChild);

    expect(parent.childNodes.length).toBe(3);
    expect(parent.childNodes[0]).toBe(firstChild);
    expect(parent.childNodes[1]).toBe(secondChild);
    expect(parent.childNodes[2]).toBe(thirdChild);

    platformService.insertBefore(parent, newChild, secondChild);

    expect(parent.childNodes.length).toBe(4);
    expect(parent.childNodes[0]).toBe(firstChild);
    expect(parent.childNodes[1]).toBe(newChild);
    expect(parent.childNodes[2]).toBe(secondChild);
    expect(parent.childNodes[3]).toBe(thirdChild);
  });

  // clearChildNodes
  // ------------------
  
  it(`#should clear all child nodes from an element`, () => {
    const testText = `<div>Child1</div><div>Child2</div><div>Child3</div>`;

    const parent = document.createElement('div');
    parent.innerHTML = testText;

    platformService.clearChildNodes(parent);

    expect(parent.childNodes.length).toBe(0);
  });

  it(`#should do nothing when trying clear all child nodes from a null element`, () => {
    const testText = `<div>Child1</div><div>Child2</div><div>Child3</div>`;

    const parent = document.createElement('div');
    parent.innerHTML = testText;

    platformService.clearChildNodes(null as any);

    expect(parent.childNodes.length).toBe(3);
  });

  // removeChild
  // ------------------

  it(`#should remove child node of an element`, () => {
    const testText = `<div>Child1</div><div>Child2</div><div>Child3</div>`;

    const parent = document.createElement('div');
    parent.innerHTML = testText;
    const toBeRemoved = parent.firstChild;

    platformService.removeChild(parent, toBeRemoved as any);

    expect(parent.childNodes.length).toBe(2);
    expect((parent.firstChild as any).textContent).toBe('Child2');
  });

  // getInnerContent
  // ------------------

  it(`#should return the inner content of an element`, () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div>
        <h1>>Some title</h1>
        <p>Some text</p>
      </div>
    `;

    const returnedContent = platformService.getInnerContent(element);

    expect(element.innerHTML).toBe(returnedContent);
  });

  // setInnerContent
  // ------------------

  it(`#should set innerHTML of an element`, () => {
    const expectedContent = 'TEST_TEXT';

    const element = document.createElement('div');

    platformService.setInnerContent(element, expectedContent);

    expect(element.innerHTML).toBe(expectedContent);
  });

  it(`#should do nothing when trying to set innerHTML of a null element`, () => {
    const expectedContent = 'TEST_TEXT';

    const element = document.createElement('div');
    element.innerHTML = expectedContent;

    platformService.setInnerContent(null as any, 'NEW_TEST_TEXT');

    expect(element.innerHTML).toBe(expectedContent);
  });

  // getTextContent
  // ------------------

  it(`#should return the text content of an element`, () => {
    const element = document.createElement('div');
    element.innerHTML = '&gt;';

    const returnedText = platformService.getTextContent(element)!;

    // InnerText should automatically convert html entities
    expect(returnedText).toBe('>');
    expect(element.innerText).toBe(returnedText);
  });

});