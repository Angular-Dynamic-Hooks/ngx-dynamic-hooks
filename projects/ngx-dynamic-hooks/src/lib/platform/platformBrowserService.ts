import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { PlatformService } from './platformService';

/**
 * Platform Browser Implementation of PlatformService
 */
@Injectable()
export class PlatformBrowserService implements PlatformService {
  constructor(private sanitizer: DomSanitizer) { }

  findPlaceholderElement(contentElement: Element, token: string, hookId: string): Element|null {
    return contentElement && contentElement.querySelector('[parsetoken="' + token + '"][hookid="' + hookId + '"]');
  }

  getAttribute(element: Element, attributeName: string): string|null {
    return element && element.getAttribute && element.getAttribute(attributeName);
  }

  getChildNodes(node: Node): Node[] {
    return node && Array.prototype.slice.call(node.childNodes);
  }

  getTagName(element: Element): string {
    return element && element.tagName;
  }

  removeChild(parentElement: Node, childElement: Node): void {
    if (parentElement && childElement) {
      parentElement.removeChild(childElement);
    }
  }

  clearChildNodes(element: Node): void {
    if (element) {
      while (element.firstChild) {
        if (element.lastChild) {
          element.removeChild(element.lastChild);
        }
      }
    }
  }

  getNgVersion(): number {
    if (typeof document !== "undefined" && document.querySelector('[ng-version]')?.getAttribute('ng-version')) {
      const versionAttr = document.querySelector('[ng-version]')?.getAttribute('ng-version')!;
      return parseInt(versionAttr, 10);
    }
    return 0;
  }

  getParentNode(element: Node): Node | null {
    return element && element.parentNode;
  }

  setInnerContent(element: Element, content: string): void {
    if (element) {
      element.innerHTML = content;
    }
  }

  getInnerText(element: HTMLElement): string {
    return element && element.innerText;
  }

  sanitize(content: string): string|null {
    return this.sanitizer.sanitize(SecurityContext.HTML, content);
  }
}