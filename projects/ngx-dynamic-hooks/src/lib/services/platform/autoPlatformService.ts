import { Inject, Injectable, Optional } from '@angular/core';
import { CompletePlatformService, PLATFORM_SERVICE, PlatformService } from './platformService';
import { DefaultPlatformService } from './defaultPlatformService';

/**
 * Wrapper class that either calls user-provided PlatformService methods or falls back to default implementations
 */
@Injectable({
  providedIn: 'root'
})
export class AutoPlatformService implements CompletePlatformService {

  constructor(@Optional() @Inject(PLATFORM_SERVICE) private userPlatformService: PlatformService, private defaultPlatformService: DefaultPlatformService) {
  }

  private getFor (methodName: string): PlatformService {
    if (this.userPlatformService && typeof (this.userPlatformService as any)[methodName] === 'function') {
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

  sortElements(a: any, b: any): number {
    return this.getFor('sortElements').sortElements!(a, b);
  }

  cloneElement(element: any) {
    return this.getFor('cloneElement').cloneElement!(element);
  }

  getTagName(element: any) {
    return this.getFor('getTagName').getTagName!(element);
  }

  getOpeningTag(element: any) {
    return this.getFor('getOpeningTag').getOpeningTag!(element);
  }

  getClosingTag(element: any) {
    return this.getFor('getClosingTag').getClosingTag!(element);
  }

  getAttributeNames(element: any) {
    return this.getFor('getAttributeNames').getAttributeNames!(element);
  }

  getAttribute(element: any, attributeName: string) {
    return this.getFor('getAttribute').getAttribute!(element, attributeName);
  }

  setAttribute(element: any, attributeName: string, value: string) {
    return this.getFor('setAttribute').setAttribute!(element, attributeName, value);
  }

  removeAttribute(element: any, attributeName: string) {
    return this.getFor('removeAttribute').removeAttribute!(element, attributeName);
  }

  getParentNode(element: any) {
    return this.getFor('getParentNode').getParentNode!(element);
  }

  querySelectorAll(parentElement: any, selector: string) {
    return this.getFor('querySelectorAll').querySelectorAll!(parentElement, selector);
  }

  getChildNodes(node: any) {
    return this.getFor('getChildNodes').getChildNodes!(node);
  }

  appendChild(parentElement: any, childElement: any) {
    return this.getFor('appendChild').appendChild!(parentElement, childElement);
  }

  insertBefore(parentElement: any, childElement: any, referenceElement: any) {
    return this.getFor('insertBefore').insertBefore!(parentElement, childElement, referenceElement);
  }
  
  clearChildNodes(element: any) {
    return this.getFor('clearChildNodes').clearChildNodes!(element);
  }

  removeChild(parentElement: any, childElement: any) {
    return this.getFor('removeChild').removeChild!(parentElement, childElement);
  }

  getInnerContent(element: Node) {
    return this.getFor('getInnerContent').getInnerContent!(element);
  }

  setInnerContent(element: any, content: string) {
    return this.getFor('setInnerContent').setInnerContent!(element, content);
  }

  isTextNode(element: any) {
    return this.getFor('isTextNode').isTextNode!(element);
  }

  createTextNode(content: string) {
    return this.getFor('createTextNode').createTextNode!(content);
  }

  getTextContent(element: any) {
    return this.getFor('getTextContent').getTextContent!(element);
  }

}