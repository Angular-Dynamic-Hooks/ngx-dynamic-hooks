import { TestBed } from '@angular/core/testing';
import { ContentSanitizer } from '../../lib/services/utils/contentSanitizer';
import { anchorAttrHookId, anchorAttrParseToken, getParseOptionDefaults } from '../testing-api';

/**
 * ContentSanitizer tests
 */
describe('ContentSanitizer', () => {
  let sanitizer: ContentSanitizer;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ContentSanitizer
      ]
    });

    sanitizer = TestBed.inject(ContentSanitizer);
  });

  it('#should sanitize common elements', () => {
    const testText = `
    <script>console.log("somescript");</script>
    <p style="color: blue" onclick="return 'someString'">
      Here is some test
      <span id="someId">Some span with an id</span>
      <custom-element></custom-element>
    </p>`;
    const contentElement = document.createElement('div');
    contentElement.innerHTML = testText;

    sanitizer.sanitize(contentElement, {}, 'asdasdasd');

    // Ensure that content is sanitized
    expect(contentElement.innerHTML).not.toContain('<script>');

    let pEl = contentElement.querySelector('p');
    expect(pEl!.getAttribute('style')).toBeNull();
    expect(pEl!.onclick).toBeNull();

    let spanEl = contentElement.querySelector('span');
    expect(spanEl!.getAttribute('id')).toBeNull();    
    expect(spanEl!.innerHTML).toContain('Some span with an id');

    let customEl = contentElement.querySelector('custom-element');
    expect(customEl).toBeNull();
  });

  it('#should not call console.warn during sanitization', () => {
    const testText = `<script>console.log("somescript");</script>`;
    const contentElement = document.createElement('div');
    contentElement.innerHTML = testText;
    const consoleWarnSpy = spyOn(console, 'warn').and.callThrough();

    sanitizer.sanitize(contentElement, {}, 'asdasdasd');

    // Ensure that content is sanitized
    expect(contentElement.innerHTML).not.toContain('<script>');
    
    // Ensure that console.warn was not called
    expect(consoleWarnSpy.calls.all().length).toBe(0);

    // Ensure that it works afterwards again though
    console.warn('Should work!');
    expect(consoleWarnSpy.calls.all().length).toBe(1);
  });

  it('#should only partially sanitize hook anchors', () => {
    const parseToken = "1a2b3c4d5e";
    const hookIndex = {
      1: {
        id: 1
      },
      2: {
        id: 2
      }
    };    

    const testText = `
    <p style="color: blue" onclick="return 'someString'">
      This is the first anchor
      <dynamic-hooks-anchor ${anchorAttrHookId}="1" ${anchorAttrParseToken}="${parseToken}">
        <span id="someId">
          This is the second anchor
          <dynamic-hooks-anchor 
            id="yetAnotherId" 
            class="myWidget someOtherClass"
            href="https://www.warcraft-toys.com/toy/123456" 
            src="/someFolder/someImage.png"
            [exampleInput]="{name: 'Kenobi'}"
            (exampleOutput)="context.someFunc(context.var)"
            ${anchorAttrHookId}="2" 
            ${anchorAttrParseToken}="${parseToken}"
          >
        </span>
      </dynamic-hooks-anchor>
    </p>`;
    const contentElement = document.createElement('div');
    contentElement.innerHTML = testText;

    // Make sure second anchor indeed has all attrs specified above
    let secondAnchor = contentElement.querySelector(`[${anchorAttrHookId}="2"][${anchorAttrParseToken}="${parseToken}"]`);
    expect(secondAnchor?.getAttributeNames()).toEqual(['id', 'class', 'href', 'src', '[exampleinput]', '(exampleoutput)', anchorAttrHookId, anchorAttrParseToken]);

    sanitizer.sanitize(contentElement, hookIndex as any, parseToken);

    // Normal elements should be sanitized as expected
    let pEl = contentElement.querySelector('p');
    expect(pEl!.getAttribute('style')).toBeNull();
    expect(pEl!.onclick).toBeNull();
    expect(pEl!.innerHTML).toContain('This is the first anchor');

    let spanEl = contentElement.querySelector('span');
    expect(spanEl!.getAttribute('id')).toBeNull();
    expect(spanEl!.innerHTML).toContain('This is the second anchor');

    // Anchor should still exist and have only special anchor attrs and safe attributes left
    let firstAnchor = contentElement.querySelector(`[${anchorAttrHookId}="1"][${anchorAttrParseToken}="${parseToken}"]`);
    secondAnchor = contentElement.querySelector(`[${anchorAttrHookId}="2"][${anchorAttrParseToken}="${parseToken}"]`);
    expect(firstAnchor).not.toBe(null);
    expect(secondAnchor).not.toBe(null);
    expect(secondAnchor?.getAttributeNames()).toEqual([anchorAttrHookId, anchorAttrParseToken, 'class', 'href', 'src']);
    expect(secondAnchor?.getAttribute('class')).toBe('myWidget someOtherClass');
    expect(secondAnchor?.getAttribute('href')).toBe('https://www.warcraft-toys.com/toy/123456');
    expect(secondAnchor?.getAttribute('src')).toBe('/someFolder/someImage.png');
  });

  it('#should sanitize hook anchor content', () => {
    const parseToken = "1a2b3c4d5e";
    const hookIndex = {
      1: {
        id: 1
      }
    };    

    const testText = `
      <dynamic-hooks-anchor ${anchorAttrHookId}="1" ${anchorAttrParseToken}="${parseToken}">
        With some dubious <span id="someId">element</span>
        <script>console.log('and a script tag');</script>
      </dynamic-hooks-anchor>
    `;
    const contentElement = document.createElement('div');
    contentElement.innerHTML = testText;

    sanitizer.sanitize(contentElement, hookIndex as any, parseToken);

    expect(contentElement.innerHTML).not.toContain('<script>');
    const spanEl = contentElement.querySelector('span');
    expect(spanEl!.getAttribute('id')).toBeNull();    
    expect(spanEl!.innerHTML).toContain('element');
  });

  it('#should have fixed bug: Did not sanitize anchor content when there were no line breaks in the innerHTML', () => {
    const parseToken = "1a2b3c4d5e";
    const hookIndex = {
      1: {
        id: 1
      }
    };    

    const testText = `<dynamic-hooks-anchor ${anchorAttrHookId}="1" ${anchorAttrParseToken}="${parseToken}">With some dubious <span id="someId">element</span><script>console.log('and a script tag');</script></dynamic-hooks-anchor>`;
    const contentElement = document.createElement('div');
    contentElement.innerHTML = testText;

    sanitizer.sanitize(contentElement, hookIndex as any, parseToken);

    expect(contentElement.innerHTML).not.toContain('<script>');

    const spanEl = contentElement.querySelector('span');
    expect(spanEl!.getAttribute('id')).toBeNull();    
    expect(spanEl!.innerHTML).toContain('element');
  });

  it('#should keep anchor references when sanitizing', () => {
    const parseToken = "1a2b3c4d5e";
    const hookIndex = {
      1: {
        id: 1
      },
      2: {
        id: 2
      }
    };  

    const testText = `
    <p>
      This is the first anchor
      <dynamic-hooks-anchor ${anchorAttrHookId}="1" ${anchorAttrParseToken}="${parseToken}"></dynamic-hooks-anchor>
      This is the second anchor
      <dynamic-hooks-anchor ${anchorAttrHookId}="2" ${anchorAttrParseToken}="${parseToken}"></dynamic-hooks-anchor>
    </p>`;
    const contentElement = document.createElement('div');
    contentElement.innerHTML = testText;

    const firstAnchorBefore = contentElement.querySelector(`[${anchorAttrHookId}="1"][${anchorAttrParseToken}="${parseToken}"]`);
    const secondAnchorBefore = contentElement.querySelector(`[${anchorAttrHookId}="2"][${anchorAttrParseToken}="${parseToken}"]`);

    sanitizer.sanitize(contentElement, hookIndex as any, parseToken);

    const firstAnchorAfter = contentElement.querySelector(`[${anchorAttrHookId}="1"][${anchorAttrParseToken}="${parseToken}"]`);
    const secondAnchorAfter = contentElement.querySelector(`[${anchorAttrHookId}="2"][${anchorAttrParseToken}="${parseToken}"]`);

    expect(firstAnchorBefore).toBe(firstAnchorAfter);
    expect(secondAnchorBefore).toBe(secondAnchorAfter);
  });


});