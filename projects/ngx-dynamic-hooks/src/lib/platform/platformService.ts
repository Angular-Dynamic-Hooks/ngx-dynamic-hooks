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
   * Finds a placeholder element by token and hookId
   * @param contentElement 
   * @param token 
   * @param hookId 
   */
  abstract findPlaceholderElement(contentElement: any, token: string, hookId: string): any;
  
  /**
   * Returns the value of an element attribute.
   * @param element The element
   * @param attributeName Attribute Name
   */
  abstract getAttribute(element: any, attributeName: string): string;
  
  /**
   * Returns the child nodes of a node.
   * @param node A node
   */
  abstract getChildNodes(node: any): any[];
  
  /**
   * Returns Angular Version.
   */
  abstract getNgVersion(): number;
  
  /**
   * Returns the tag name of an element.
   * @param element An element
   */
  abstract getTagName(element: any): string;
  
  /**
   * Returns the parent of an element.
   * @param element An element
   */
  abstract getParentNode(element: any): any;
  
  /**
   * Returns the inner text of an element.
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
   * Sanitizes a dynamic component content.
   * @param content The content to be sanitized.
   */
  abstract sanitize(content: string): string;
  
  /**
   * Sets the content of an element.
   * @param element An element
   * @param content The element content
   */
  abstract setInnerContent(element: any, content: string): void;
}
