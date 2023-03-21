import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeScript, SafeStyle, SafeUrl } from '@angular/platform-browser';
import { PlatformBrowserService, OutletComponent } from '../testing-api';
import { EmptyTestComponent } from '../resources/components/emptyTest/emptyTest.c';

class MockDomSanitizer implements DomSanitizer {
  bypassSecurityTrustHtml(value: string): SafeHtml {
    throw new Error('Method not implemented.');
  }

  bypassSecurityTrustStyle(value: string): SafeStyle {
    throw new Error('Method not implemented.');
  }

  bypassSecurityTrustScript(value: string): SafeScript {
    throw new Error('Method not implemented.');
  }

  bypassSecurityTrustUrl(value: string): SafeUrl {
    throw new Error('Method not implemented.');
  }

  bypassSecurityTrustResourceUrl(value: string): SafeResourceUrl {
    throw new Error('Method not implemented.');
  }

  sanitize(context: any, content: string): string {
    return content;
  }
}

function getPlatformService() {
  return new PlatformBrowserService(new MockDomSanitizer());
}

describe('PlatformBrowserService', () => {
  it('#should find placeholder by token and hookId', () => {
    const platformService = getPlatformService();

    const token = 'TEST_TOKEN';
    const hookId = 'TEST_HOOK_ID';

    const testText = `
      <div parsetoken="${token}" hookid="${hookId}"></div>
    `;

    const contentElement = document.createElement('div',);
    contentElement.innerHTML = testText;

    const placeholderElement = platformService.findPlaceholderElement(contentElement, token, hookId);

    expect(placeholderElement).not.toBeNull();
    expect(placeholderElement.getAttribute('parsetoken')).toBe(token);
    expect(placeholderElement.getAttribute('hookid')).toBe(hookId);
  })

  it('#should not find placeholder by wrong token and hookId', () => {
    const platformService = getPlatformService();

    const token = 'TEST_TOKEN';
    const hookId = 'TEST_HOOK_ID';

    const wrongToken = 'TEST_TOKEN1';
    const wrongHookId = 'TEST_HOOK_ID1';

    const testText = `
      <div parsetoken="${token}" hookid="${hookId}"></div>
    `

    const contentElement = document.createElement('div',);
    contentElement.innerHTML = testText;

    const placeholderElement = platformService.findPlaceholderElement(contentElement, wrongToken, wrongHookId);

    expect(placeholderElement).toBeNull();

  });

  it('#should return attribute value by given attribute name', () => {
    const platformService = getPlatformService();

    const attrName = 'testattr';
    const attrValue = 'TEST_VALUE';

    const element = document.createElement('div');
    element.setAttribute(attrName, attrValue);

    const result = platformService.getAttribute(element, attrName);

    expect(result).toBe(attrValue);
  });

  it('#should return null when element is undefined', () => {
    const platformService = getPlatformService();

    const attrName = 'testattr';

    const result = platformService.getAttribute(null as any, attrName);

    expect(result).toBeNull();
  });

  it('#should return null when attribute does not exist', () => {
    const platformService = getPlatformService();

    const attrName = 'testattr';
    const attrValue = 'TEST_VALUE';
    const wrongAttrName = 'testattr1';

    const element = document.createElement('div');
    element.setAttribute(attrName, attrValue);

    const result = platformService.getAttribute(element, wrongAttrName);

    expect(result).toBeNull();
  });

  it('#should return child nodes of an element', () => {
    const platformService = getPlatformService();

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
    const platformService = getPlatformService();

    const element = document.createElement('div');

    const childNodes = platformService.getChildNodes(element);

    expect(childNodes).not.toBeNull();
    expect(childNodes.length).toBe(0);
  });

  it('#should return null as child nodes when parent is null', () => {
    const platformService = getPlatformService();

    const childNodes = platformService.getChildNodes(null as any);

    expect(childNodes).toBeNull();
  });

  it(`#should return the element's tag name`, () => {
    const platformService = getPlatformService();

    const expectedTagName = 'DIV';

    const element = document.createElement(expectedTagName);

    const actualTagName = platformService.getTagName(element);

    expect(actualTagName).toBe(expectedTagName);
  });

  it(`#should return null as tag name when element is null`, () => {
    const platformService = getPlatformService();

    const actualTagName = platformService.getTagName(null as any);

    expect(actualTagName).toBeNull();
  });

  it(`#should remove child node of an element`, () => {
    const platformService = getPlatformService();

    const testText = `<div>Child1</div><div>Child2</div><div>Child3</div>`;

    const parent = document.createElement('div');
    parent.innerHTML = testText;
    const toBeRemoved = parent.firstChild;

    platformService.removeChild(parent, toBeRemoved as any);

    expect(parent.childNodes.length).toBe(2);
    expect((parent.firstChild as any).textContent).toBe('Child2');
  });

  it(`#should do nothing when trying to remove a child element from null parent`, () => {
    const platformService = getPlatformService();

    const testText = `<div>Child1</div><div>Child2</div><div>Child3</div>`;

    const parent = document.createElement('div');
    parent.innerHTML = testText;
    const toBeRemoved = parent.firstChild;

    platformService.removeChild(null as any, toBeRemoved as any);

    expect(parent.childNodes.length).toBe(3);
  });

  it(`#should do nothing when trying to remove a null child element from a parent`, () => {
    const platformService = getPlatformService();

    const testText = `<div>Child1</div><div>Child2</div><div>Child3</div>`;

    const parent = document.createElement('div');
    parent.innerHTML = testText;

    platformService.removeChild(parent, null as any);

    expect(parent.childNodes.length).toBe(3);
  });

  it(`#should clear all child nodes from an element`, () => {
    const platformService = getPlatformService();

    const testText = `<div>Child1</div><div>Child2</div><div>Child3</div>`;

    const parent = document.createElement('div');
    parent.innerHTML = testText;

    platformService.clearChildNodes(parent);

    expect(parent.childNodes.length).toBe(0);
  });

  it(`#should do nothing when trying clear all child nodes from a null element`, () => {
    const platformService = getPlatformService();

    const testText = `<div>Child1</div><div>Child2</div><div>Child3</div>`;

    const parent = document.createElement('div');
    parent.innerHTML = testText;

    platformService.clearChildNodes(null as any);

    expect(parent.childNodes.length).toBe(3);
  });

  it(`#should return Angular version of the document`, () => {
    const comp = TestBed.createComponent(EmptyTestComponent);
    const platformService = getPlatformService();

    const ngVersion = '9.0';
    const expectedNgversion = parseInt(ngVersion, 10);

    comp.nativeElement.setAttribute('ng-version', ngVersion);

    const actualNgVersion = platformService.getNgVersion();

    expect(actualNgVersion).toBe(expectedNgversion);
  });

  it(`#should return 0 as Angular version there's no ng-version`, () => {
    const comp = TestBed.createComponent(EmptyTestComponent);
    const platformService = getPlatformService();

    comp.nativeElement.removeAttribute('ng-version');

    const actualNgVersion = platformService.getNgVersion();

    expect(actualNgVersion).toBe(0);
  });

  it(`#should return parent node an element`, () => {
    const platformService = getPlatformService();

    const testText = `<div>Child1</div>`;

    const parent = document.createElement('div');
    parent.innerHTML = testText;
    const child = parent.firstChild;

    const actualParent = platformService.getParentNode(child as any);

    expect(actualParent).not.toBeNull();
    expect(actualParent).toBe(parent);
  });

  it(`#should return null as parent when child node is null`, () => {
    const platformService = getPlatformService();

    const actualParent = platformService.getParentNode(null as any);

    expect(actualParent).toBeNull();
  });

  it(`#should set innerHTML of an element`, () => {
    const platformService = getPlatformService();

    const expectedContent = 'TEST_TEXT';

    const element = document.createElement('div');

    platformService.setInnerContent(element, expectedContent);

    expect(element.innerHTML).toBe(expectedContent);
  });

  it(`#should do nothing when trying to set innerHTML of a null element`, () => {
    const platformService = getPlatformService();

    const expectedContent = 'TEST_TEXT';

    const element = document.createElement('div');
    element.innerHTML = expectedContent;

    platformService.setInnerContent(null as any, 'NEW_TEST_TEXT');

    expect(element.innerHTML).toBe(expectedContent);
  });

  it(`#should return inner text of an element`, () => {
    const platformService = getPlatformService();

    const expectedContent = 'TEST_TEXT';

    const element = document.createElement('div');
    element.innerText = expectedContent;

    const actualContent = platformService.getInnerText(element);

    expect(element.innerText).toBe(actualContent);
  });

  it(`#should return null when trying to return inner text of a null element`, () => {
    const platformService = getPlatformService();

    const actualContent = platformService.getInnerText(null);

    expect(actualContent).toBeNull();
  });

  it(`#should sanitize an element`, () => {
    const platformService = getPlatformService();

    const testText = `<div>Child1</div>`;
    const expectedResult = 'SANITIZED';

    spyOn(platformService['sanitizer'], 'sanitize').and.returnValue(expectedResult);

    const actualResult = platformService.sanitize(testText);

    expect(actualResult).toBe(expectedResult);
  });
});