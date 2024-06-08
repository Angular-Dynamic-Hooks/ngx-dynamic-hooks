import { InjectionToken } from "@angular/core";

export const PLATFORM_SERVICE = new InjectionToken<PlatformService>('An injection token to retrieve an optionally user-provded platformService');

/**
 * Extend this service to implement custom platform.
 */
export interface CompletePlatformService {

  /**
   * Returns Angular Version.
   * Returns null when it couldn't be retrieved
   */
  getNgVersion(): number|null;

  /**
   * Sanitizes a string of arbitrary html content to be safe for use in innerHTML
   * Returns the sanitized html string
   * @param content The content to be sanitized.
   */
  sanitize(content: string): string;

  /**
   * Creates an element and returns it
   * @param tagName The name of the element
   */
  createElement(tagName: string): any;

  /**
   * Returns the tag name of an element
   * @param element An element
   */
  getTagName(element: any): string;

  /**
   * Returns the names of all existing attributes of an element
   * Return an emtpy array if none exist
   * @param element The element
   */
  getAttributeNames(element: any): string[];

  /**
   * Returns the value of an element attribute.
   * Returns null when the attribute doesn't exist
   * @param element The element
   * @param attributeName Attribute Name
   */
  getAttribute(element: any, attributeName: string): string|null;

  /**
   * Sets the value of an element attribute.
   * @param element The element
   * @param attributeName Attribute Name
   * @param value The attribute value
   */
  setAttribute(element: any, attributeName: string, value: string): void;

  /**
   * Removes the value of an element attribute.
   * @param element The element
   * @param attributeName Attribute Name
   */
  removeAttribute(element: any, attributeName: string): void;

  /**
   * Returns the parent of a node.
   * Returns null when a parent node doesn't exist
   * @param parentany The parent element
   */
  getParentNode(parentNode: any): any|null;

  /**
   * Returns child elements of a parent element that match a certain css selector
   * Returns an empty array of none could be found
   * @param parentElement The parent element
   * @param selector The css-style selector to find the elements (like "div.myClass")
   */
  querySelectorAll(parentElement: any, selector: string): any[];

  /**
   * Returns an array of child nodes.
   * Returns an empty array if none exist
   * @param parentNode A node
   */
  getChildNodes(parentNode: any): any[];

  /**
   * Appends a child node to a parent.
   * @param parentNode The parent node
   * @param childNode The child node to be removed
   */
  appendChild(parentNode: any, childNode: any): void;

  /**
   * Inserts a child node before another child node of a parent node.
   * @param parentNode The parent node
   * @param childNode The child node to be inserted
   * @param referenceNode The existing node before which childNode is inserted
   */
  insertBefore(parentNode: any, childNode: any, referenceNode: any): void;

  /**
  * Removes all child nodes from a parent node.
  * @param parentNode The parent node
  */
  clearChildNodes(parentNode: any): void;

  /**
   * Removes a child node from its parent.
   * @param parentNode The parent node
   * @param childNode The child node to be removed
   */
  removeChild(parentNode: any, childNode: any): void;

  /**
   * Returns the inner content of an element (like HTMLElement.innerHTML)
   * @param element An element
   */
  getInnerContent(element: any): string;

  /**
   * Sets the content of an element.
   * @param element An element
   * @param content The element content
   */
  setInnerContent(element: any, content: string): void;

  /**
   * Returns the plain inner text of an element (like HTMLElement.innerText)
   * @param element An element
   */
  getInnerText(element: any): string;
}

export type PlatformService =  Partial<CompletePlatformService>;
