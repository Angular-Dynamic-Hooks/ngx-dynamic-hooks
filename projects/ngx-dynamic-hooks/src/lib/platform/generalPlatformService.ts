import { Inject, Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { PlatformService } from './platformService';
import { DOCUMENT } from '@angular/common';

/**
 * General implementation of PlatformService suited for both the standard browser and server environments
 */
@Injectable()
export class GeneralPlatformService implements PlatformService {
  constructor(@Inject(DOCUMENT) private document: Document, private sanitizer: DomSanitizer) { 
  }

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

  getNgVersion(): number|null {
    if (typeof this.document !== "undefined" && this.document.querySelector('[ng-version]')?.getAttribute('ng-version')) {
      const versionAttr = this.document.querySelector('[ng-version]')?.getAttribute('ng-version')!;
      return parseInt(versionAttr, 10);
    }
    return null;
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