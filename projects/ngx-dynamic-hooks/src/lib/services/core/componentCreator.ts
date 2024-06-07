import { Inject, Injector, PLATFORM_ID, ApplicationRef, isDevMode, Injectable, createComponent, EnvironmentInjector, reflectComponentType } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { combineLatest, ReplaySubject, of } from 'rxjs';
import { first, mergeMap, tap, catchError } from 'rxjs/operators';

import { Hook, HookIndex } from '../../interfacesPublic';
import { DynamicContentChild, ComponentConfig, LazyLoadComponentConfig } from '../../interfacesPublic';
import { PLATFORM_SERVICE, PlatformService } from '../platform/platformService';
import { OutletOptions } from '../settings/options';
import { ComponentUpdater } from './componentUpdater';
import { AutoPlatformService } from '../platform/autoPlatformService';

/**
 * The service responsible for dynamically creating components for all found Hooks
 */
@Injectable({
  providedIn: 'root'
})
export class ComponentCreator {

  constructor(
    @Inject(PLATFORM_ID) private platformId: number,
    private appRef: ApplicationRef,
    private componentUpdater: ComponentUpdater, 
    private platformService: AutoPlatformService
  ) {
  }

  /**
   * The main entry function to start the dynamic component initialization process
   *
   * @param contentElement - The container element with the component selector tags in its innerHTML
   * @param hookIndex - The current hookIndex (ids must match component selector ids)
   * @param token - The token used for parsetoken-attribute of the component selectors
   * @param context - The current context object
   * @param options - The current HookComponentOptions
   * @param injector - The injector to use for the dynamically-created components
   */
  init(contentElement: any, hookIndex: HookIndex, token: string, context: any, options: OutletOptions, environmentInjector: EnvironmentInjector, injector: Injector): ReplaySubject<boolean> {
    const allComponentsLoaded: ReplaySubject<boolean> = new ReplaySubject(1);
    const componentLoadSubjects = [];
    const hookHostElements: {[key: string]: Element} = {};

    // Get HookData, replace placeholders and create desired content slots
    for (const [hookId, hook] of Object.entries(hookIndex)) {
      const placeholderElement = this.platformService.querySelectorAll(contentElement, '[parsetoken="' + token + '"][hookid="' + hookId + '"]')?.[0];

      // If removed by previous hook in loop via ng-content replacement
      if (!placeholderElement) {
        delete hookIndex[hook.id];
        continue;
      }

      hook.data = hook.parser.loadComponent(hook.id, hook.value, context, this.platformService.getChildNodes(placeholderElement));
      hook.isLazy = hook.data.component.hasOwnProperty('importPromise') && hook.data.component.hasOwnProperty('importName');

      // Skip loading lazy components during SSR
      if (!isPlatformBrowser(this.platformId) && hook.isLazy) {
        delete hookIndex[hook.id];
        continue;
      }

      // Replace placeholder element with component selector element (or a generic anchor element if lazy-loaded)
      hookHostElements[hookId] = hook.isLazy ? placeholderElement : this.replaceAnchorElement(placeholderElement, hook.data.component as new(...args: any[]) => any);

      // Insert child content according to hook.data immediately
      // This has the benefit that if the child content is custom, the next iterations of this loop will throw out all hooks whose placeholder elements 
      // can no longer be found (b/c they were in the discarded child content) so their component won't be unnecessarily loaded.
      this.createContentSlotElements(hookHostElements[hookId], hook, token);
    }

    // Load all components from hookIndex into the prepared host elements
    for (const [hookId, hook] of Object.entries(hookIndex)) {

      // Start with of(true) to catch errors from loadComponentClass in the observable stream as well
      componentLoadSubjects.push(of(true)
        // Load component class first (might be lazy-loaded)
        .pipe(mergeMap(() => this.loadComponentClass(hook.data!.component)))
        .pipe(tap((compClass) => {
          // Check if the host element is simply an anchor for a lazily-loaded component. If so, insert proper selector now.
          hookHostElements[hookId] = hook.isLazy ? this.replaceAnchorElement(hookHostElements[hookId], compClass, true) : hookHostElements[hookId];
          // Get projectableNodes from the content slots
          const projectableNodes = this.extractContentSlotElements(hookHostElements[hookId], token);
          // Instantiate component
          this.createComponent(hook, context, hookHostElements[hookId], projectableNodes, options, compClass, environmentInjector, injector);
        }))
        // If could not be created, remove from hookIndex
        .pipe(catchError((e) => {
          if (isDevMode()) {
            console.error(e.stack);
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
    combineLatest([...componentLoadSubjects]).pipe(first()).subscribe(() => {

      // Call dynamic lifecycle methods for all created components
      for (const hook of Object.values(hookIndex)) {
        // Find all content children components
        const contentChildren: Array<DynamicContentChild> = [];
        if (typeof hook.componentRef!.instance['onDynamicMount'] === 'function' || typeof hook.componentRef!.instance['onDynamicChanges'] === 'function') {
          this.findContentChildren(hook.componentRef!.location.nativeElement, contentChildren, hookIndex, token);
        }

        // OnDynamicChanges
        if (typeof hook.componentRef!.instance['onDynamicChanges'] === 'function') {
          hook.componentRef!.instance['onDynamicChanges']({contentChildren});
        }

        // OnDynamicMount
        if (typeof hook.componentRef!.instance['onDynamicMount'] === 'function') {
          hook.componentRef!.instance['onDynamicMount']({context, contentChildren});
        }
      }

      // Remove now redundant attributes from component elements
      for (const hostElement of Object.values(hookHostElements)) {
        this.platformService.removeAttribute(hostElement, 'hookid');
        this.platformService.removeAttribute(hostElement, 'parsetoken');
        this.platformService.removeAttribute(hostElement, 'ng-version');
      }

      // Done!
      allComponentsLoaded.next(true);
    });

    return allComponentsLoaded;
  }

  // DOM manipulation
  // ----------------------------------------------------------------------------------------------------------------

  /**
   * Replaces a placeholder anchor element created in HooksReplacer with the actual component selector elements.
   * If a component is lazily-loaded however, the selector element is instead inserted as a child
   *
   * Explanation: 
   * When a component is created, one of its projectableNodes happens to be a placeholder element, but that component doesn't render the placeholder right away
   * (due to *ngIf, for example), you can't replace that placeholder anymore as it now exclusively exists in Angular's memory as a reference. And that exact reference will 
   * be rendered when the component decides to show it. The only thing you can do is insert children into that reference.
   *
   * @param anchorElement - The preliminary anchor placeholder element
   * @param compClass - The loaded component class
   * @param insertAsChild - Whether to replace the anchor element with the new selector element or insert it as a child
   */
  replaceAnchorElement(anchorElement: any, compClass: new(...args: any[]) => any, insertAsChild: boolean = false): any {
    const selector = reflectComponentType(compClass)!.selector;
    const selectorElement = this.platformService.createElement(selector);

    // Move attributes to selector
    this.platformService.setAttribute(selectorElement, 'hookid', this.platformService.getAttribute(anchorElement, 'hookid')!);
    this.platformService.setAttribute(selectorElement, 'parsetoken', this.platformService.getAttribute(anchorElement, 'parsetoken')!);
    if (this.platformService.getAttribute(anchorElement, 'parser')) {
      this.platformService.setAttribute(selectorElement, 'parser', this.platformService.getAttribute(anchorElement, 'parser')!);
    }

    this.platformService.removeAttribute(anchorElement, 'hookid');
    this.platformService.removeAttribute(anchorElement, 'parsetoken');
    this.platformService.removeAttribute(anchorElement, 'parser');

    // Move child nodes to selector
    const childNodes = this.platformService.getChildNodes(anchorElement);
    for (const node of childNodes) {
      this.platformService.appendChild(selectorElement, node);
    }

    // Replace anchorElement or insert as child of anchorElement
    if (insertAsChild) {
      // Add selector name as class to anchor (for easier identification via css and such)
      this.platformService.setAttribute(anchorElement, 'class', (this.platformService.getAttribute(anchorElement, 'class') || '') + (selector + '-anchor'));
      this.platformService.appendChild(anchorElement, selectorElement);

    } else {
      this.platformService.insertBefore(this.platformService.getParentNode(anchorElement)!, selectorElement, anchorElement);
      this.platformService.removeChild(this.platformService.getParentNode(anchorElement)!, anchorElement);
    }

    return selectorElement;
  }

  /**
   * Creates a content slot dom element for each ng-content outlet of the dynamically loaded component.
   *
   * This is to create a direct dom-representation of each entry in the projectableNodes array returned
   * by parser.loadComponent, so it can be cleanly resolved back into projectableNodes later on. Without these
   * content slots for separation, you wouldn't know which child nodes go into which ng-content slot.
   *
   * @param hostElement - The dom element to create the content slots in
   * @param hook - The hook of the component
   * @param token - The current parse token
   */
  createContentSlotElements(hostElement: any, hook: Hook, token: string): void {
    let content;

    // If content property is defined, use the submitted content slots
    if (hook.data!.hasOwnProperty('content') && Array.isArray(hook.data!.content)) {
      content = hook.data!.content;
    // Otherwise just wrap existing content into single content slot
    } else {
      content = [this.platformService.getChildNodes(hostElement)];
    }

    // Empty child nodes
    this.platformService.clearChildNodes(hostElement);

    // Insert new ones
    for (const [index, contentSlot] of content.entries()) {
      if (contentSlot !== undefined && contentSlot !== null) {
        const contentSlotElement = this.platformService.createElement('dynamic-component-contentslot');
        this.platformService.setAttribute(contentSlotElement, 'slotIndex', index.toString());
        this.platformService.setAttribute(contentSlotElement, 'parsetoken', token);
        for (const node of contentSlot) {
          this.platformService.appendChild(contentSlotElement, node);
        }
        this.platformService.appendChild(hostElement, contentSlotElement);
      }
    }
  }

  /**
   * Returns all previously created content slots for a component element as a projectableNodes[][] array
   *
   * @param componentHostElement - The dom element with the content slots
   * @param token - The current parse token
   */
  extractContentSlotElements(componentHostElement: any, token: string): Node[][] {
    // Resolve ng-content from content slots
    const projectableNodes: Node[][] = [];
    const contentSlotElements = this.platformService.getChildNodes(componentHostElement)
      .filter(entry => this.platformService.getTagName(entry) === 'DYNAMIC-COMPONENT-CONTENTSLOT' && this.platformService.getAttribute(entry, 'parsetoken') === token);

    for (const contentSlotElement of contentSlotElements) {
      const slotIndex = this.platformService.getAttribute(contentSlotElement, 'slotIndex')!;
      projectableNodes[parseInt(slotIndex)] = this.platformService.getChildNodes(contentSlotElement);
    }

    // Bugfix: Make sure to manually remove the content slots and not just rely on createComponent() to do so. 
    // Otherwise they will persist with SSR due to hydration bug.
    this.platformService.clearChildNodes(componentHostElement);

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

    // b) If is LazyLoadComponentConfig
    } else if (componentConfig.hasOwnProperty('importPromise') && componentConfig.hasOwnProperty('importName')) {
      // Catch typical importPromise error
      if ((componentConfig as LazyLoadComponentConfig).importPromise instanceof Promise) {
        throw Error(`When lazy-loading a component, the "importPromise"-field must contain a function returning the import-promise, but it contained the promise itself.`);
      }

      (componentConfig as LazyLoadComponentConfig).importPromise().then((m) =>  {
        const importName = (componentConfig as LazyLoadComponentConfig).importName;
        const compClass = Object.prototype.hasOwnProperty.call(m, importName) ? m[importName] : m['default'];
        componentClassLoaded.next(compClass);
      });

    } else {
      throw Error('The "component" property of a returned HookData object must either contain the component class or a LazyLoadComponentConfig');
    }

    return componentClassLoaded;
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
   * @param injector - The default injector to use for the component
   */
  createComponent(hook: Hook, context: any, componentHostElement: any, projectableNodes: Array<Array<any>>, options: OutletOptions, compClass: new(...args: any[]) => any, environmentInjector: EnvironmentInjector, injector: Injector): void {
    
    // Dynamically create component
    // Note: Transcluded content (including components) for ng-content can simply be added here in the form of the projectableNodes-argument.
    // The order of component creation or injection via projectableNodes does not seem to matter.
    const dynamicComponentRef = createComponent(compClass, {
      hostElement: componentHostElement,
      environmentInjector: hook.data!.environmentInjector || environmentInjector,
      elementInjector: hook.data!.injector || injector, 
      projectableNodes: projectableNodes
    });
    
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
  findContentChildren(node: any, treeLevel: Array<DynamicContentChild> = [], hookIndex: HookIndex, token: string): void {
    const childNodes = this.platformService.getChildNodes(node);
    if (childNodes != undefined && childNodes.length > 0) {
      childNodes.forEach((childNode, key) => {
        let componentFound = false;
        // If element has a parsetoken and hookid, it is a dynamic component
        const parseToken = this.platformService.getAttribute(childNode, 'parsetoken');

        if (
          parseToken !== null &&
          parseToken === token &&
          this.platformService.getAttribute(childNode, 'hookid')
        ) {
          const hookId = parseInt(this.platformService.getAttribute(childNode, 'hookid')!, 10);
          if (hookIndex.hasOwnProperty(hookId)) {
            treeLevel.push({
              componentRef: hookIndex[hookId].componentRef!,
              componentSelector: this.platformService.getTagName(childNode).toLowerCase(),
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
