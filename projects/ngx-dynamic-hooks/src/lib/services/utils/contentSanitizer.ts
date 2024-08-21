import { Injectable } from '@angular/core';
import { HookIndex } from '../../interfacesPublic';
import { AutoPlatformService } from '../platform/autoPlatformService';
import { anchorAttrHookId, anchorAttrParseToken } from '../../constants/core';
import { matchAll } from './utils';

const sanitizerPlaceholderTag = 'dynamic-hooks-sanitization-placeholder';
const sanitizerPlaceholderRegex = new RegExp(`<\/?${sanitizerPlaceholderTag}.*?>`, 'g');

/**
 * A utility service that sanitizes an Element and all of its children while exluding found hook elements
 */
@Injectable({
  providedIn: 'root'
})
export class ContentSanitizer {
  
  attrWhitelist = [anchorAttrHookId, anchorAttrParseToken, 'class', 'href', 'src']

  constructor(private platformService: AutoPlatformService) {}

  /**
   * Sanitizes an element while preserving marked hook anchors
   * 
   * @param contentElement - The element to sanitize
   * @param hookIndex - The current hookIndex
   * @param token - The current ParseToken
   */
  sanitize(contentElement: any, hookIndex: HookIndex, token: string): any {
    const originalHookAnchors: {[key: string]: any} = {};

    // Replace all hook anchors with custom placeholder elements
    // This is so the browser has no predefined rules where they can and can't exist in the dom hierarchy and doesn't edit the html.
    for (const hook of Object.values(hookIndex)) {
      const anchorElement = this.platformService.querySelectorAll(contentElement, `[${anchorAttrHookId}="${hook.id}"][${anchorAttrParseToken}="${token}"]`)?.[0];
      if (anchorElement) {
        originalHookAnchors[hook.id] = anchorElement;

        const parentElement = this.platformService.getParentNode(anchorElement);
        const childNodes = this.platformService.getChildNodes(anchorElement);

        const placeholderElement = this.platformService.createElement(sanitizerPlaceholderTag);
        this.platformService.setAttribute(placeholderElement, anchorAttrHookId, hook.id.toString());
        this.platformService.setAttribute(placeholderElement, anchorAttrParseToken, token);
        this.platformService.insertBefore(parentElement, placeholderElement, anchorElement);
        this.platformService.removeChild(parentElement, anchorElement);
        for (const node of childNodes) {
          this.platformService.appendChild(placeholderElement, node);
        }
      }
    }

    // Encode sanitization placeholders (so they survive sanitization)
    let innerHTML = this.platformService.getInnerContent(contentElement);
    innerHTML = this.findAndEncodeTags(innerHTML, sanitizerPlaceholderRegex);

    // Sanitize (without warnings)
    const consoleWarnFn = console.warn;
    console.warn = () => {};
    let sanitizedInnerHtml = this.platformService.sanitize(innerHTML);
    console.warn = consoleWarnFn;

    // Decode sanitization placeholders
    sanitizedInnerHtml = this.decodeTagString(sanitizedInnerHtml);
    contentElement.innerHTML = sanitizedInnerHtml || '';

    // Restore original hook anchors
    for (const [hookId, anchorElement] of Object.entries(originalHookAnchors)) {
      const placeholderElement = this.platformService.querySelectorAll(contentElement, `${sanitizerPlaceholderTag}[${anchorAttrHookId}="${hookId}"]`)?.[0];
      if (placeholderElement) {
        const parentElement = this.platformService.getParentNode(placeholderElement);
        const childNodes = this.platformService.getChildNodes(placeholderElement);
        this.platformService.insertBefore(parentElement, anchorElement, placeholderElement);
        this.platformService.removeChild(parentElement, placeholderElement);
        for (const node of childNodes) {
          this.platformService.appendChild(anchorElement, node);
        }

        // As a last step, sanitize the hook anchor attrs as well
        this.sanitizeElementAttrs(anchorElement);
      }
    }

    return contentElement;
  }

  /**
   * Sanitizes a single element's attributes
   *
   * @param element - The element in question
   */
  private sanitizeElementAttrs(element: any): any {
      // Collect all existing attributes, put them on span-element, sanitize it, then copy surviving attrs back onto hook anchor element
      const attrs = this.platformService.getAttributeNames(element);
      const tmpWrapperElement = this.platformService.createElement('div');
      const tmpElement = this.platformService.createElement('span');
      this.platformService.appendChild(tmpWrapperElement, tmpElement);
      
      // Move attr to tmp
      for (const attr of attrs) {
        try {
          this.platformService.setAttribute(tmpElement, attr, this.platformService.getAttribute(element, attr)!);
        } catch (e) {}
        // Keep in separate try-catch, so the first doesn't stop the second
        try {
          // Always keep those two
          if (attr !== anchorAttrHookId && attr !== anchorAttrParseToken) {
            this.platformService.removeAttribute(element, attr);
          }
        } catch (e) {}          
      }

      // Sanitize tmp
      tmpWrapperElement.innerHTML = this.platformService.sanitize(this.platformService.getInnerContent(tmpWrapperElement));

      // Move surviving attrs back to element
      const sanitizedTmpElement = this.platformService.querySelectorAll(tmpWrapperElement, 'span')[0];
      const survivingAttrs = this.platformService.getAttributeNames(sanitizedTmpElement);
      for (const survivingAttr of survivingAttrs) {
        try {
          this.platformService.setAttribute(element, survivingAttr, this.platformService.getAttribute(sanitizedTmpElement, survivingAttr)!);
        } catch (e) {}
      }

      return element;
  }

  // En/decoding placeholders
  // ------------------------

  /**
   * Finds and encodes all tags that match the specified regex so that they survive sanitization
   * 
   * @param content - The stringified html content to search
   * @param substrRegex - The regex that matches the element tags
   */
  private findAndEncodeTags(content: string, substrRegex: RegExp): string {
    let encodedContent = content;

    const matches = matchAll(content, substrRegex);
    matches.sort((a, b) => b.index - a.index);

    for (const match of matches) {
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;

      const textBeforeSelector = encodedContent.substring(0, startIndex);
      const encodedPlaceholder = this.encodeTagString(encodedContent.substring(startIndex, endIndex));
      const textAfterSelector = encodedContent.substring(endIndex);
      encodedContent = textBeforeSelector + encodedPlaceholder + textAfterSelector;
    }

    return encodedContent;
  }

  /**
   * Encodes the special html chars in a html tag so that is is considered a harmless string
   *
   * @param element - The element as a string
   */
  private encodeTagString(element: string): string {
    element = element.replace(/</g, '@@@hook-lt@@@');
    element = element.replace(/>/g, '@@@hook-gt@@@');
    element = element.replace(/"/g, '@@@hook-dq@@@');
    return element;
  }

  /**
   * Decodes the encoded html chars in a html tag again
   *
   * @param element - The element as a string
   */
  private decodeTagString(element: string): string {
    element = element.replace(/@@@hook-lt@@@/g, '<');
    element = element.replace(/@@@hook-gt@@@/g, '>');
    element = element.replace(/@@@hook-dq@@@/g, '"');
    return element;
  }

}
