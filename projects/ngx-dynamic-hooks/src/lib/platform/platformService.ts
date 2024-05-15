/**
 * Extend this service to implement custom platform.
 */
export abstract class PlatformService {
  /**
   * Clears the child nodes of an element.
   * @param element An Element
   */
  abstract clearChildNodes(element: any): void;

  /**
   * Returns a (placeholder) element with a particular token- and hookId-attribute in a given contentElement
   * Returns null when such an element couldn't be retrieved
   * @param contentElement - The content/container element to search
   * @param token - A string that appears as the "token"-attribute on the element
   * @param hookId - A string that appears as the "hookId"-attribute on the element
   */
  abstract findPlaceholderElement(contentElement: any, token: string, hookId: string): any|null;

  /**
   * Returns the value of an element attribute.
   * Returns null when the attribute couldn't be retrieved
   * @param element The element
   * @param attributeName Attribute Name
   */
  abstract getAttribute(element: any, attributeName: string): string|null;

  /**
   * Returns an array of child nodes.
   * Returns an empty array if there's no child nodes and null when child node information couldn't be retrieved
   * @param node A node
   */
  abstract getChildNodes(node: any): any[];

  /**
   * Returns Angular Version.
   * Returns null when it couldn't be retrieved
   */
  abstract getNgVersion(): number|null;

  /**
   * Returns the tag name of an element.
   * Returns null when it couldn't be retrieved.
   * @param element An element
   */
  abstract getTagName(element: any): string;

  /**
   * Returns the parent of an element.
   * Returns null when it couldn't be retrieved
   * @param element An element
   */
  abstract getParentNode(element: any): any|null;

  /**
   * Returns the inner text of an element.
   * Returns null when it couldn't be retrieved
   * @param element An element
   */
  abstract getInnerText(element: any): string;

  /**
   * Removes a child element from its parent.
   * @param parentElement The parent element
   * @param childElement The child element to be removed
   */
  abstract removeChild(parentElement: any, childElement: any): void;

  /**
   * Sanitizes a string of arbitrary html content to be safe for use in innerHTML
   * Returns the sanitized html string
   * @param content The content to be sanitized.
   */
  abstract sanitize(content: string): string|null;

  /**
   * Sets the content of an element.
   * @param element An element
   * @param content The element content
   */
  abstract setInnerContent(element: any, content: string): void;
}
