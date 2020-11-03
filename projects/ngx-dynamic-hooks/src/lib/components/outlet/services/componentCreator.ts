import { ComponentFactoryResolver, Injector, ApplicationRef, isDevMode, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { combineLatest, ReplaySubject, of } from 'rxjs';
import { first, mergeMap, tap, catchError } from 'rxjs/operators';

import { Hook, HookIndex } from '../../../interfacesPublic';
import { DynamicContentChild, ComponentConfig, LazyLoadComponentConfig } from '../../../interfacesPublic';
import { OutletOptions } from '../options/options';
import { ComponentUpdater } from './componentUpdater';

/**
 * The service responsible for dynamically creating components for all found Hooks
 */
@Injectable()
export class ComponentCreator {
  private renderer: Renderer2;

  constructor(private injector: Injector, private cfr: ComponentFactoryResolver, private appRef: ApplicationRef, private rendererFactory: RendererFactory2, private componentUpdater: ComponentUpdater) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  /**
   * The main entry function to start the dynamic component initialization process
   *
   * @param hostElement - The host element with the component selector tags in its innerHTML
   * @param hookIndex - The current hookIndex (ids must match component selector ids)
   * @param token - The token used for parsetoken-attribute of the component selectors
   * @param context - The current context object
   * @param options - The current HookComponentOptions
   */
  init(hostElement: HTMLElement, hookIndex: HookIndex, token: string, context: any, options: OutletOptions): ReplaySubject<boolean> {
    const allComponentsLoaded: ReplaySubject<boolean> = new ReplaySubject(1);
    const componentLoadSubjects = [];
    const hookPlaceholders = {};

    // Get HookData and create desired content slots
    for (const [hookId, hook] of Object.entries(hookIndex)) {
      const placeholderElement = hostElement.querySelector('[parsetoken="' + token + '"][hookid="' + hookId + '"]');
      if (placeholderElement) {
        hookPlaceholders[hookId] = placeholderElement;
        hook.data = hook.parser.loadComponent(hook.id, hook.value, context, Array.prototype.slice.call(placeholderElement.childNodes));

        // Replace child nodes with all desired ng-content slots
        // Doing this immediately after the evaluation of each hook so that succeeding hooks that are
        // removed by the previous' hooks ng-content don't even need to be evaluated (let alone loaded below)
        this.createContentSlotElements(placeholderElement, hook, token);
      } else {
        // If removed by previous hook in loop via ng-content replacement
        delete hookIndex[hook.id];
      }
    }

    // Load all components in hookIndex into the component placeholders
    for (const [hookId, hook] of Object.entries(hookIndex)) {
      const placeholderElement = hookPlaceholders[hookId];

      // Start with of(true) to catch errors from loadComponentClass in the observable stream as well
      componentLoadSubjects.push(of(true)
        // Load component class first (might be lazy-loaded)
        .pipe(mergeMap(() => this.loadComponentClass(hook.data.component)))
        .pipe(tap((compClass) => {
          // Replace placeholder with actual component selector element
          const componentHostElement = this.replacePlaceholderElement(compClass, placeholderElement);
          // Get projectableNodes from content slots
          const projectableNodes = this.getContentSlotElements(componentHostElement, token);
          // Instantiate component
          this.createComponent(hook, context, componentHostElement, projectableNodes, options, compClass);
        }))
        // If could not be created, remove from hookIndex
        .pipe(catchError((e) => {
          if (isDevMode()) {
            console.error(e.message);
          }
          delete hookIndex[hook.id];
          return of(null);
        })));
    }

    // If no components in text, no need to progress further
    if (componentLoadSubjects.length === 0) {
      allComponentsLoaded.next(true);
      return allComponentsLoaded;
    }

    // Once all normal and lazy components have loaded
    combineLatest(...componentLoadSubjects).pipe(first()).subscribe(() => {

      // Call dynamic lifecycle methods for all created components
      for (const hook of Object.values(hookIndex)) {
        // Find all content children components
        const contentChildren: Array<DynamicContentChild> = [];
        if (typeof hook.componentRef.instance['onDynamicMount'] === 'function' || typeof hook.componentRef.instance['onDynamicChanges'] === 'function') {
          this.findContentChildren(hook.componentRef.location.nativeElement, contentChildren, hookIndex, token);
        }

        // OnDynamicChanges
        if (typeof hook.componentRef.instance['onDynamicChanges'] === 'function') {
          hook.componentRef.instance['onDynamicChanges']({contentChildren});
        }

        // OnDynamicMount
        if (typeof hook.componentRef.instance['onDynamicMount'] === 'function') {
          hook.componentRef.instance['onDynamicMount']({context, contentChildren});
        }
      }

      // Remove now redundant attributes from component elements
      const componentElements = hostElement.querySelectorAll('[hookid][parsetoken="' + token + '"]');
      componentElements.forEach((componentElement, key) => {
        this.renderer.removeAttribute(componentElement, 'hookid');
        this.renderer.removeAttribute(componentElement, 'parsetoken');
        this.renderer.removeAttribute(componentElement, 'parser');
        this.renderer.removeAttribute(componentElement, 'ng-version');
      });

      // Done!
      allComponentsLoaded.next(true);
    });

    return allComponentsLoaded;
  }

  /**
   * Creates a content slot dom element for each ng-content outlet of the dynamically loaded component.
   *
   * This is to create a direct dom-representation of each entry in the projectableNodes array returned
   * by parser.loadComponent, so it can be cleanly resolved back into projectableNodes later on. Without these
   * content slots for seperation, you wouldn't know which child nodes go into which ng-content slot.
   *
   * @param placeholderElement - The dom element to create the content slots in
   * @param hook - The hook of the component
   * @param token - The current parse token
   */
  createContentSlotElements(placeholderElement: Element, hook: Hook, token: string): void {
    let content;

    // If content property is defined, use the submitted content slots
    if (hook.data.hasOwnProperty('content') && Array.isArray(hook.data.content)) {
      content = hook.data.content;
    // Otherwise just wrap existing content into single content slot
    } else {
      content = [Array.prototype.slice.call(placeholderElement.childNodes)];
    }

    // Empty child nodes
    // Note: Not sure why, but renderer.removeChild() and placeholderElement.removeChild() do not reliably work here. Fallback on native method.
    placeholderElement.innerHTML = '';

    // Insert new ones
    let slotIndex = 0;
    for (const contentSlot of content) {
      if (contentSlot !== undefined && contentSlot !== null) {
        const contentSlotElement = this.renderer.createElement('dynamic-component-placeholder-contentslot');
        this.renderer.setAttribute(contentSlotElement, 'slotIndex', slotIndex.toString());
        this.renderer.setAttribute(contentSlotElement, 'parsetoken', token);
        for (const node of contentSlot) {
          this.renderer.appendChild(contentSlotElement, node);
        }
        this.renderer.appendChild(placeholderElement, contentSlotElement);
      }
      slotIndex++;
    }
  }

  /**
   * Returns all previously created content slots for a component element as a projectableNodes[][] array
   *
   * @param componentHostElement - The dom element with the content slots
   * @param token - The current parse token
   */
  getContentSlotElements(componentHostElement: Element, token: string): Array<Array<Element>> {
    // Resolve ng-content from content slots
    const projectableNodes = [];
    const contentSlotElements = Array.prototype.slice.call(componentHostElement.childNodes)
      .filter(entry => entry.tagName === 'DYNAMIC-COMPONENT-PLACEHOLDER-CONTENTSLOT' && entry.getAttribute('parsetoken') === token);

    for (const contentSlotElement of contentSlotElements) {
      const slotIndex = contentSlotElement.getAttribute('slotIndex');
      projectableNodes[slotIndex] = Array.prototype.slice.call(contentSlotElement.childNodes);
    }

    return projectableNodes;
  }


  // Component creation
  // ----------------------------------------------------------------------------------------------------------------

  /**
   * Takes a hook along with a DOM node and loads the specified component class (normal or lazy-loaded).
   * Returns a subject the emits the component class when ready.
   *
   * @param componentConfig - The componentConfig from HookData
   */
  loadComponentClass(componentConfig: ComponentConfig): ReplaySubject<new(...args: any[]) => any> {
    const componentClassLoaded: ReplaySubject<new(...args: any[]) => any> = new ReplaySubject(1);

    // a) If is normal class
    if (componentConfig.hasOwnProperty('prototype')) {
      componentClassLoaded.next(componentConfig as (new(...args: any[]) => any));

    // b) If is LazyLoadingComponentConfig
    } else if (componentConfig.hasOwnProperty('importPromise') && componentConfig.hasOwnProperty('importName')) {
      // Catch typical importPromise error
      if ((componentConfig as LazyLoadComponentConfig).importPromise instanceof Promise) {
        throw Error(`When lazy-loading a component, the "importPromise"-field must contain a function returning the import-promise, but it contained the promise itself.`);
      }
      // Warning if using old Angular version
      if (document && document.querySelector('[ng-version]')) {
        const version = parseInt(document.querySelector('[ng-version]').getAttribute('ng-version'), 10);
        if (version < 9 && isDevMode()) {
          console.warn('It seems you are trying to use lazy-loaded-components with an Angular version older than 9. Please note that this functionality requires the new Ivy renderer to be enabled.');
        }
      }

      (componentConfig as LazyLoadComponentConfig).importPromise().then((m) =>  {
        const importName = (componentConfig as LazyLoadComponentConfig).importName;
        const compClass = m.hasOwnProperty(importName) ? m[importName] : m['default'];
        componentClassLoaded.next(compClass);
      });

    } else {
      throw Error('The "component" property of a returned HookData object must either contain the component class or a LazyLoadComponentConfig');
    }

    return componentClassLoaded;
  }

  /**
   * Replaces a placeholder element with the correct component selector element once the component has been loaded
   *
   * @param compClass - The component class
   * @param placeholderElement - The placeholder element to be replaced
   */
  replacePlaceholderElement(compClass: new(...args: any[]) => any, placeholderElement: Element): Element {
    const selector = this.cfr.resolveComponentFactory(compClass).selector;
    const componentElement = this.renderer.createElement(selector);

    this.renderer.setAttribute(componentElement, 'hookid', placeholderElement.getAttribute('hookid'));
    this.renderer.setAttribute(componentElement, 'parsetoken', placeholderElement.getAttribute('parsetoken'));
    this.renderer.setAttribute(componentElement, 'parser', placeholderElement.getAttribute('parser'));

    const childNodes = Array.prototype.slice.call(placeholderElement.childNodes);
    for (const node of childNodes) {
      this.renderer.appendChild(componentElement, node);
    }

    this.renderer.insertBefore(placeholderElement.parentNode, componentElement, placeholderElement);
    // Note: renderer.removeChild() once again does not reliably work here. Fallback on native method.
    placeholderElement.parentNode.removeChild(placeholderElement);

    return componentElement;
  }

  /**
   * Dynamically creates a component in the specified componentHostElement
   *
   * @param hook - The hook for this component
   * @param context - The current context
   * @param componentHostElement - The hostElement for the component
   * @param projectableNodes - The nodes to inject as ng-content
   * @param options - The current HookComponentOptions
   * @param compClass - The component's class
   */
  createComponent(hook: Hook, context: any, componentHostElement: Element, projectableNodes: Array<Array<Element>>, options: OutletOptions, compClass: new(...args: any[]) => any): void {

    // Dynamically create component
    // Note: Transcluded content (including components) for ng-content can simply be added here in the form of the projectableNodes-argument.
    // The order of component creation or injection via projectableNodes does not seem to matter.
    const dynamicComponentFactory = this.cfr.resolveComponentFactory(compClass);
    const injector = hook.data.injector ? hook.data.injector : this.injector;
    const dynamicComponentRef = dynamicComponentFactory.create(injector, projectableNodes, componentHostElement);

    // Track component
    hook.componentRef = dynamicComponentRef;

    // Set initial bindings
    hook.bindings = hook.parser.getBindings(hook.id, hook.value, context);
    this.componentUpdater.updateComponentWithNewOutputs(hook, context, options);
    this.componentUpdater.updateComponentWithNewInputs(hook, options);

    // Call initial OnDynamicChanges with context (if not undefined)
    if (typeof hook.componentRef.instance['onDynamicChanges'] === 'function' && context !== undefined) {
      hook.componentRef.instance['onDynamicChanges']({context});
    }

    // Activate change detection
    this.appRef.attachView(dynamicComponentRef.hostView);

    // Trigger an Initial cd call to:
    // - have Angular automatically invoke ngOnInit(), which happens the first time the change detector runs for a component
    // - prevent ExpressionHasChangedErrors in Angular<8
    dynamicComponentRef.changeDetectorRef.detectChanges();
  }

  // After component creation
  // ----------------------------------------------------------------------------------------------------------------

  /**
   * Find all components that would be the ContentChildren of a dynamic component and returns them in a hierarchical tree object
   * Important: This function depends on the component selector attributes 'parsetoken' and 'hookid' not being removed yet
   *
   * @param node - The HTML node to parse
   * @param treeLevel - The current tree level of DynamicContentChildren (for recursiveness)
   * @param hookIndex - The current hookIndex
   * @param token - The current parseToken
   */
  findContentChildren(node: Node, treeLevel: Array<DynamicContentChild> = [], hookIndex: HookIndex, token: string): void {
    if (node['childNodes'] !== undefined && node.childNodes.length > 0) {
      node.childNodes.forEach((childNode, key) => {
        let componentFound = false;
        // If element has a parsetoken and hookid, it is a dynamic component
        if (
          childNode['attributes'] !== undefined &&
          childNode['hasAttribute']('parsetoken') &&
          childNode['getAttribute']('parsetoken') === token &&
          childNode['hasAttribute']('hookid')
        ) {
          const hookId = parseInt(childNode['getAttribute']('hookid'), 10);
          if (hookIndex.hasOwnProperty(hookId)) {
            treeLevel.push({
              componentRef: hookIndex[hookId].componentRef,
              componentSelector: childNode['tagName'].toLowerCase(),
              contentChildren: [],
              hookValue: hookIndex[hookId].value
            });
            componentFound = true;
          }
        }

        // The hierarchical structure of the result is solely built on found components. It DOES NOT reflect the actual HTML structure.
        // E.g. two components returned on the same array level in the result may be on completely different nesting levels in the HTML,
        // as the only reason to 'go a level deeper' in the result is when a component was found.
        const treeLevelForNested = componentFound ? treeLevel[treeLevel.length - 1].contentChildren : treeLevel;
        this.findContentChildren(childNode, treeLevelForNested, hookIndex, token);
      });
    }
  }
}
