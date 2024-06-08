import { Injectable } from '@angular/core';
import { HookIndex } from '../../interfacesPublic';
import { AutoPlatformService } from '../platform/autoPlatformService';
import { attrNameHookId, attrNameParseToken } from '../../constants/core';

/**
 * A utility service that sanitizes an Element and all of its children while exluding found hook elements
 */
@Injectable({
  providedIn: 'root'
})
export class ContentSanitizer {
  sanitizerPlaceholderClass = '_ngx_dynamic_hooks_sanitize_placeholder_';
  attrWhitelist = [attrNameHookId, attrNameParseToken, 'class', 'href', 'src']

  constructor(private platformService: AutoPlatformService) {}

  sanitize(contentElement: Element, hookIndex: HookIndex, token: string): Element {
    const originalHookAnchors: {[key: string]: Element} = {};
    const originalHtml = contentElement.innerHTML;

    // Replace all found hook anchors with placeholders that survive sanitization
    for (const hook of Object.values(hookIndex)) {
      const anchorElement = this.platformService.querySelectorAll(contentElement, `[${attrNameHookId}="${hook.id}"][${attrNameParseToken}="${token}"]`)?.[0];
      if (anchorElement) {
        originalHookAnchors[hook.id] = anchorElement;

        const parentElement = this.platformService.getParentNode(anchorElement);
        const childNodes = this.platformService.getChildNodes(anchorElement);

        // Use spans for placeholders. Browsers care about its placement and content the least. Only not allowed in certain parts of tables and direct ul/ol child.
        const placeholderElement = this.platformService.createElement('span');
        this.platformService.setAttribute(placeholderElement, 'class', this.sanitizerPlaceholderClass + hook.id);
        this.platformService.insertBefore(parentElement, placeholderElement, anchorElement);
        this.platformService.removeChild(parentElement, anchorElement);
        for (const node of childNodes) {
          this.platformService.appendChild(placeholderElement, node);
        }
      }
    }
    
    // Sanitize
    const innerHTML = this.platformService.getInnerContent(contentElement);
    const sanitizedInnerHtml = this.platformService.sanitize(innerHTML);
    contentElement.innerHTML = sanitizedInnerHtml || '';

    // Restore original hook anchors
    for (const [hookId, anchorElement] of Object.entries(originalHookAnchors)) {
      const placeholderElement = this.platformService.querySelectorAll(contentElement, `.${this.sanitizerPlaceholderClass}${hookId}`)?.[0];
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

    
    console.log('original html', originalHtml)
    console.log('placeholder html:', innerHTML);
    console.log('sanitized string:', sanitizedInnerHtml);
    console.log('dom final:', contentElement.innerHTML);
    

    return contentElement;
  }

  /**
   * Sanitizes an existing element's attributes and modifies/removes them according to sanitization logic
   *
   * @param element - The element whose attrs should be checked
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
          if (attr !== attrNameHookId && attr !== attrNameParseToken) {
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

}
