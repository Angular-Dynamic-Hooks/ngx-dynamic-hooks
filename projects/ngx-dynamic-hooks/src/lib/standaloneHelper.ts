import { isAngularManagedElement } from './services/utils/utils';
import { contentElementAttr } from './constants/core';

/**
 * A function that observes an HTMLElement and triggers a callback when new elements are added to it.
 * Does NOT trigger for Angular components or logic, only for neutral HTML elements.
 * 
 * @param content - The HTMLElement to watch for element additions
 * @param callbackFn - The callback function to call when a change occurs. Will be called with the closest parent element of all added elements.
 */
export const observeElement = (content: HTMLElement, callbackFn: (parentElement: HTMLElement) => void): MutationObserver => {
  const observer = new MutationObserver((mutationsList, observer) => {

    // Collect only addded nodes
    let newNodes: Node[] = [];
    for (const mutation of mutationsList) {
      mutation.addedNodes.forEach(addedNode => newNodes.push(addedNode));
      mutation.removedNodes.forEach(removedNode => newNodes = newNodes.filter(newNode => newNode !== removedNode));
    }

    // Ignore new nodes created as part of Angular component views
    newNodes = newNodes.filter(newNode => 
      newNode.nodeType === 1 && !isAngularManagedElement(newNode) ||            // Check HTMLElements
      newNode.nodeType === 3 && !isAngularManagedElement(newNode.parentNode!)   // Check text node parents
    );

    // Ignore new nodes that are children of a content element that is currently being parsed (lots of elements get created/removed during that time)
    newNodes = newNodes.filter(newNode => {
      const element: HTMLElement = newNode.nodeType === 1 ? newNode as HTMLElement : newNode.parentElement!;
      return element.closest(`[${contentElementAttr}]`) === null;
    });

    if (newNodes.length) {
      // Find closest common parent
      const commonParent = findClosestCommonParent(newNodes)!;

      // Run callback
      callbackFn(commonParent);
    }
  });

  observer.observe(content, { childList: true, subtree: true });

  return observer;
}

/**
 * Finds the closest common parent element for multiple elements
 * 
 * @param elements - The elements in question
 */
const findClosestCommonParent = (elements: Node[]): HTMLElement|null => {
  if (elements.length === 0) return null;
  let parent = elements[0];

  for (const element of elements) {
    while (parent === element || !parent.contains(element)) {
      parent = parent.parentElement!;
    }
  }

  return parent as HTMLElement;
}