import { Inject, Injectable, Renderer2, RendererFactory2, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CompletePlatformService } from './platformService';
import { DOCUMENT } from '@angular/common';

/**
 * General implementation of PlatformService suited for both the standard browser and server environments
 */
@Injectable({
  providedIn: 'root'
})
export class DefaultPlatformService implements CompletePlatformService {
  private renderer: Renderer2;

  constructor(@Inject(DOCUMENT) private document: Document, private rendererFactory: RendererFactory2, private sanitizer: DomSanitizer) { 
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  getNgVersion() {
    if (typeof this.document !== "undefined") {
      const versionElement = this.querySelectorAll(this.document, '[ng-version]')?.[0];
      const versionAttr = versionElement?.getAttribute('ng-version');
      if (versionAttr) {
        return parseInt(versionAttr, 10);
      }
    }

    return null;
  }
  
  sanitize(content: string) {
    return this.sanitizer.sanitize(SecurityContext.HTML, content) || '';
  }

  createElement(tagName: string): Element {
    return this.renderer.createElement(tagName);
  }

  sortElements(a: Element, b: Element): number {
    if ( a === b) return 0;

    if ( !a.compareDocumentPosition) {
      // support for IE8 and below
      return (a as any).sourceIndex - (b as any).sourceIndex;
    }

    if ( a.compareDocumentPosition(b) & 2) {
      // b comes before a
      return 1;
    }

    return -1;
  }

  cloneElement(element: Element) {
    return element.cloneNode();
  }

  getTagName(element: Element) {
    return element.tagName;
  }

  getAttributeNames(element: Node) {
    return typeof (element as any).getAttributeNames === 'function' ? (element as any).getAttributeNames() : [];
  }

  getAttribute(element: Element, attributeName: string) {
    return typeof (element as any).getAttribute === 'function' ? (element as any).getAttribute(attributeName) : null;
  }

  setAttribute(element: Element, attributeName: string, value: string) {
    this.renderer.setAttribute(element, attributeName, value);
  }

  removeAttribute(element: any, attributeName: string) {
    this.renderer.removeAttribute(element, attributeName);
  }

  getParentNode(element: Node): Node|null {
    try {
      return this.renderer.parentNode(element);
    } catch (e) {
      return null;
    }
  }

  querySelectorAll(parentElement: Document|Element, selector: string): Element[] {
    return Array.from(parentElement.querySelectorAll(selector));
  }

  getChildNodes(node: Node): Node[] {
    return Array.prototype.slice.call(node.childNodes);
  }

  appendChild(parentElement: Node, childElement: Node) {
    this.renderer.appendChild(parentElement, childElement);
  }

  insertBefore(parentElement: Node, childElement: Node, referenceElement: Node) {
    this.renderer.insertBefore(parentElement, childElement, referenceElement);
  }
  
  clearChildNodes(element: Node) {
    if (element) {
      while (element.firstChild) {
        this.removeChild(element, element.firstChild);
      }
    }
  }

  removeChild(parentElement: Node, childElement: Node) {
    parentElement.removeChild(childElement);
  }

  getInnerContent(element: Element) {
    return element.innerHTML;
  }

  setInnerContent(element: Element, content: string) {
    if (element) {
      element.innerHTML = content;
    }
  }

  getInnerText(element: HTMLElement) {
    return element.innerText;
  }

}