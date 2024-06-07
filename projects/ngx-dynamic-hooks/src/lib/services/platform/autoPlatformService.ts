import { Inject, Injectable } from '@angular/core';
import { CompletePlatformService, PLATFORM_SERVICE, PlatformService } from './platformService';
import { DefaultPlatformService } from './defaultPlatformService';

/**
 * Wrapper class that either calls user-provided PlatformService methods or falls back to default implementations
 */
@Injectable({
  providedIn: 'root'
})
export class AutoPlatformService implements CompletePlatformService {

  constructor(@Inject(PLATFORM_SERVICE) private userPlatformService: PlatformService, private defaultPlatformService: DefaultPlatformService) {
  }

  private getFor (methodName: string): PlatformService {
    if (typeof (this.userPlatformService as any)[methodName] === 'function') {
      return this.userPlatformService
    } else {
      return this.defaultPlatformService;
    }
  }

  getNgVersion() {
    return this.getFor('getNgVersion').getNgVersion!();
  }
  
  sanitize(content: string) {
    return this.getFor('sanitize').sanitize!(content);
  }

  createElement(tagName: string) {
    return this.getFor('createElement').createElement!(tagName);
  }

  getTagName(element: Node) {
    return this.getFor('getTagName').getTagName!(element);
  }

  getAttribute(element: Node, attributeName: string) {
    return this.getFor('getAttribute').getAttribute!(element, attributeName);
  }

  setAttribute(element: Node, attributeName: string, value: string) {
    return this.getFor('setAttribute').setAttribute!(element, attributeName, value);
  }

  removeAttribute(element: Node, attributeName: string) {
    return this.getFor('removeAttribute').removeAttribute!(element, attributeName);
  }

  getParentNode(element: Node) {
    return this.getFor('getParentNode').getParentNode!(element);
  }

  querySelectorAll(parentElement: Node, selector: string) {
    return this.getFor('querySelectorAll').querySelectorAll!(parentElement, selector);
  }

  getChildNodes(node: Node) {
    return this.getFor('getChildNodes').getChildNodes!(node);
  }

  appendChild(parentElement: Node, childElement: Node) {
    return this.getFor('appendChild').appendChild!(parentElement, childElement);
  }

  insertBefore(parentElement: Node, childElement: Node, referenceElement: Node) {
    return this.getFor('insertBefore').insertBefore!(parentElement, childElement, referenceElement);
  }
  
  clearChildNodes(element: Node) {
    return this.getFor('clearChildNodes').clearChildNodes!(element);
  }

  removeChild(parentElement: Node, childElement: Node) {
    return this.getFor('removeChild').removeChild!(parentElement, childElement);
  }

  getInnerContent(element: Node) {
    return this.getFor('getInnerContent').getInnerContent!(element);
  }

  setInnerContent(element: Node, content: string) {
    return this.getFor('setInnerContent').setInnerContent!(element, content);
  }

  getInnerText(element: Node) {
    return this.getFor('getInnerText').getInnerText!(element);
  }

}