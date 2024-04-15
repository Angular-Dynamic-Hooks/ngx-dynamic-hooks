import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { PlatformService } from './platformService';

/**
 * Platform Browser Implementation of PlatformService
 */
@Injectable()
export class PlatformBrowserService implements PlatformService {
  constructor(private sanitizer: DomSanitizer) { }

  findPlaceholderElement(contentElement: Element, token: string, hookId: string): Element {
    return contentElement && contentElement.querySelector('[parsetoken="' + token + '"][hookid="' + hookId + '"]');
  }

  getAttribute(element: Element, attributeName: string): string {
    return element && element.getAttribute && element.getAttribute(attributeName);
  }

  getChildNodes(node: Element | Node): (Element | Node)[] {
    return node && Array.prototype.slice.call(node.childNodes);
  }

  getTagName(element: Element): string {
    return element && element.tagName;
  }

  removeChild(parentElement: Element | Node, childElement: Element | Node): void {
    if (parentElement && childElement) {
      parentElement.removeChild(childElement);
    }
  }

  clearChildNodes(element: Element | Node): void {
    if (element) {
      while (element.firstChild) {
        element.removeChild(element.lastChild);
      }
    }
  }

  getNgVersion(): number {
    if (typeof document !== "undefined" && document.querySelector('[ng-version]')) {
      return parseInt(document.querySelector('[ng-version]').getAttribute('ng-version'), 10);
    }
    return 0;
  }

  getParentNode(element: Element | Node): Element | Node {
    return element && element.parentNode;
  }

  setInnerContent(element: Element, content: string): void {
    if (element) {
      element.innerHTML = content;
    }
  }

  getInnerText(element: any): string {
    return element && element.innerText;
  }

  sanitize(content: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, content);
  }
}