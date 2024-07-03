import { InjectionToken } from "@angular/core";

export const PLATFORM_SERVICE = new InjectionToken<PlatformService>('An injection token to retrieve an optionally user-provided PlatformService');

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
   * Given two elements, return a number indicating which one comes first
   * @param a - The first element
   * @param b - The second element
   * @returns - 1 if b comes before a, -1 if a comes before b, 0 if equivalent
   */
  sortElements(a: any, b: any): number

  /**
   * Return a shallow clone of an element (just the element itself, not its children)
   *
   * @param element - The element to clone
   */
  cloneElement(element: any): any

  /**
   * Returns the tag name of an element
   * @param element An element
   */
  getTagName(element: any): string;

  /**
   * Returns the opening tag of an element as a string
   * @param element An element
   */
  getOpeningTag(element: any): string;

  /**
   * Returns the closing tag of an element as a string
   * @param element An element
   */
  getClosingTag(element: any): string;

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
   * Returns a boolean determining whether an element is a text node or not
   * @param element An element
   */
  isTextNode(element: any): boolean;

   /**
   * Creates a text node and returns it
   * @param content The text content of the node
   */
  createTextNode(content: string): any;

  /**
   * Returns the pure text content of an element (like Node.textContent)
   * @param element An element
   */
  getTextContent(element: any): string|null;
}

export type PlatformService =  Partial<CompletePlatformService>;
