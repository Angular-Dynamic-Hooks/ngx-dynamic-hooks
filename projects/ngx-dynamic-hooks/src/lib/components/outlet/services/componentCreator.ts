import { ComponentFactoryResolver, Inject, Injector, PLATFORM_ID, ApplicationRef, isDevMode, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { combineLatest, ReplaySubject, of } from 'rxjs';
import { first, mergeMap, tap, catchError } from 'rxjs/operators';

import { Hook, HookIndex } from '../../../interfacesPublic';
import { DynamicContentChild, ComponentConfig, LazyLoadComponentConfig } from '../../../interfacesPublic';
import { PlatformService } from '../../../platform/platformService';
import { OutletOptions } from '../options/options';
import { ComponentUpdater } from './componentUpdater';

/**
 * The service responsible for dynamically creating components for all found Hooks
 */
@Injectable()
export class ComponentCreator {
  private renderer: Renderer2;

  constructor(
    @Inject(PLATFORM_ID) private platformId: number,
    private cfr: ComponentFactoryResolver, 
    private appRef: ApplicationRef, 
    private rendererFactory: RendererFactory2, 
    private componentUpdater: ComponentUpdater, 
    private platform: PlatformService
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
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
  init(contentElement: any, hookIndex: HookIndex, token: string, context: any, options: OutletOptions, injector: Injector): ReplaySubject<boolean> {
    const allComponentsLoaded: ReplaySubject<boolean> = new ReplaySubject(1);
    const componentLoadSubjects = [];
    const hookHostElements: {[key: string]: Element} = {};

    // Get HookData, replace placeholders and create desired content slots
    for (const [hookId, hook] of Object.entries(hookIndex)) {
      const placeholderElement = this.platform.findPlaceholderElement(contentElement, token, hookId);

      // If removed by previous hook in loop via ng-content replacement
      if (!placeholderElement) {
        delete hookIndex[hook.id];
        continue;
      }

      hook.data = hook.parser.loadComponent(hook.id, hook.value, context, this.platform.getChildNodes(placeholderElement));

      // Skip loading lazy components during SSR
      if (!isPlatformBrowser(this.platformId) && hook.data.component.hasOwnProperty('importPromise') && hook.data.component.hasOwnProperty('importName')) {
        delete hookIndex[hook.id];
        continue;
      }

      // Replace placeholder element with component selector element (or a generic anchor element if lazy-loaded)
      hookHostElements[hookId] = this.replacePlaceholderElement(placeholderElement, hook);

      // Also replace child nodes with all desired ng-content slots
      // Note: Doing this immediately after the evaluation of each hook so that succeeding hooks that are
      // removed by the previous' hooks ng-content don't even need to be evaluated (let alone loaded below)
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
          hookHostElements[hookId] = this.handleAnchorElement(hookHostElements[hookId], compClass);
          // Get projectableNodes from the content slots
          const projectableNodes = this.getContentSlotElements(hookHostElements[hookId], token);
          // Instantiate component
          this.createComponent(hook, context, hookHostElements[hookId], projectableNodes, options, compClass, injector);
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
        this.renderer.removeAttribute(hostElement, 'hookid');
        this.renderer.removeAttribute(hostElement, 'parsetoken');
        this.renderer.removeAttribute(hostElement, 'parser');
        this.renderer.removeAttribute(hostElement, 'ng-version');
      }

      // Done!
      allComponentsLoaded.next(true);
    });

    return allComponentsLoaded;
  }

  // DOM manipulation
  // ----------------------------------------------------------------------------------------------------------------

  /**
   * Replaces a placeholder element created in HooksReplacer with the actual component selector elements.
   * Note: If a component is being lazily-loaded, replace with generic anchor elements for now (see handleAnchorElements())
   *
   * @param placeholderElement - The placeholder to replace
   * @param hook - The corresponding hook object
   */
  replacePlaceholderElement(placeholderElement: any, hook: Hook): Element {
    let selector;
    if (hook.data!.component.hasOwnProperty('prototype')) {
      selector = this.cfr.resolveComponentFactory(hook.data!.component as (new(...args: any[]) => any)).selector;
    } else {
      selector = 'dynamic-component-anchor';
    }

    const hostElement = this.renderer.createElement(selector);
    this.renderer.setAttribute(hostElement, 'hookid', this.platform.getAttribute(placeholderElement, 'hookid')!);
    this.renderer.setAttribute(hostElement, 'parsetoken', this.platform.getAttribute(placeholderElement, 'parsetoken')!);
    if (this.platform.getAttribute(placeholderElement, 'parser')) {
      this.renderer.setAttribute(hostElement, 'parser', this.platform.getAttribute(placeholderElement, 'parser')!);
    }

    const childNodes = this.platform.getChildNodes(placeholderElement);
    for (const node of childNodes) {
      this.renderer.appendChild(hostElement, node);
    }

    this.renderer.insertBefore(this.platform.getParentNode(placeholderElement), hostElement, placeholderElement);
    this.platform.removeChild(this.platform.getParentNode(placeholderElement), placeholderElement);

    return hostElement;
  }

  /**
   * Once the component class has been loaded, check if the targeted host element is simply a generic anchor for a lazily-loaded component.
   * If so, insert real component selector into anchor and use that as the actual host element.
   *
   * Explanation: Anchors are necessary for lazily-loaded components b/c we can't know the selector before loading the component class, so
   * a placeholder (anchor) is inserted in the meantime.
   *
   * When the component class has been loaded, we can't safely replace that placeholder anymore with the real selector element, however, due
   * to how componentFactory.create() works. If a parent component has been handed a child component placeholder node in projectableNodes on creation,
   * but doesn't render it right away (due to *ngIf, for example), you have no way to replace that placeholder anymore as it exists in a limbo and Angular
   * will simply render the node references it was given in componentFactory.create() once the parent component renders its children.
   *
   * Due to this, the selector elements of lazily-loaded components are instead simply inserted into the placeholders/anchors as children when
   * they are ready.
   *
   * @param componentHostElement - The preliminary host element which might be an anchor
   * @param compClass - The loaded component class
   */
  handleAnchorElement(componentHostElement: any, compClass: new(...args: any[]) => any): any {
    if (this.platform.getTagName(componentHostElement) === 'DYNAMIC-COMPONENT-ANCHOR') {
      const selector = this.cfr.resolveComponentFactory(compClass).selector;
      const selectorElement = this.renderer.createElement(selector);

      // Move attributes to selector
      this.renderer.setAttribute(selectorElement, 'hookid', this.platform.getAttribute(componentHostElement, 'hookid')!);
      this.renderer.setAttribute(selectorElement, 'parsetoken', this.platform.getAttribute(componentHostElement, 'parsetoken')!);
      if (this.platform.getAttribute(componentHostElement, 'parser')) {
        this.renderer.setAttribute(selectorElement, 'parser', this.platform.getAttribute(componentHostElement, 'parser')!);
      }

      this.renderer.removeAttribute(componentHostElement, 'hookid');
      this.renderer.removeAttribute(componentHostElement, 'parsetoken');
      this.renderer.removeAttribute(componentHostElement, 'parser');

      // Move child nodes to selector
      const childNodes = this.platform.getChildNodes(componentHostElement);
      for (const node of childNodes) {
        this.renderer.appendChild(selectorElement, node);
      }

      // Add selector name as class to anchor (for easier identification via css and such)
      this.renderer.addClass(componentHostElement, selector + '-anchor');

      // Insert
      this.renderer.appendChild(componentHostElement, selectorElement);
      componentHostElement = selectorElement;
    }

    return componentHostElement;
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
      content = [this.platform.getChildNodes(hostElement)];
    }

    // Empty child nodes
    this.platform.clearChildNodes(hostElement);

    // Insert new ones
    let slotIndex = 0;
    for (const contentSlot of content) {
      if (contentSlot !== undefined && contentSlot !== null) {
        const contentSlotElement = this.renderer.createElement('dynamic-component-contentslot');
        this.renderer.setAttribute(contentSlotElement, 'slotIndex', slotIndex.toString());
        this.renderer.setAttribute(contentSlotElement, 'parsetoken', token);
        for (const node of contentSlot) {
          this.renderer.appendChild(contentSlotElement, node);
        }
        this.renderer.appendChild(hostElement, contentSlotElement);
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
  getContentSlotElements(componentHostElement: any, token: string): Element[][] {
    // Resolve ng-content from content slots
    const projectableNodes: Element[][] = [];
    const contentSlotElements = this.platform.getChildNodes(componentHostElement)
      .filter(entry => this.platform.getTagName(entry) === 'DYNAMIC-COMPONENT-CONTENTSLOT' && this.platform.getAttribute(entry, 'parsetoken') === token);

    for (const contentSlotElement of contentSlotElements) {
      const slotIndex = this.platform.getAttribute(contentSlotElement, 'slotIndex')!;
      projectableNodes[parseInt(slotIndex)] = this.platform.getChildNodes(contentSlotElement);
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

    // b) If is LazyLoadComponentConfig
    } else if (componentConfig.hasOwnProperty('importPromise') && componentConfig.hasOwnProperty('importName')) {
      // Catch typical importPromise error
      if ((componentConfig as LazyLoadComponentConfig).importPromise instanceof Promise) {
        throw Error(`When lazy-loading a component, the "importPromise"-field must contain a function returning the import-promise, but it contained the promise itself.`);
      }
      // Warning if using old Angular version
      const ngVersion = this.platform.getNgVersion();

      if (ngVersion > 0 && ngVersion < 9 && isDevMode()) {
          console.warn('It seems you are trying to use lazy-loaded-components with an Angular version older than 9. Please note that this functionality requires the new Ivy renderer to be enabled.');
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
  createComponent(hook: Hook, context: any, componentHostElement: any, projectableNodes: Array<Array<any>>, options: OutletOptions, compClass: new(...args: any[]) => any, injector: Injector): void {
    
    // Dynamically create component
    // Note: Transcluded content (including components) for ng-content can simply be added here in the form of the projectableNodes-argument.
    // The order of component creation or injection via projectableNodes does not seem to matter.
    const dynamicComponentFactory = this.cfr.resolveComponentFactory(compClass);
    const chosenInjector = hook.data!.injector || injector;
    const dynamicComponentRef = dynamicComponentFactory.create(chosenInjector, projectableNodes, componentHostElement);

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
    const childNodes = this.platform.getChildNodes(node);
    if (childNodes != undefined && childNodes.length > 0) {
      childNodes.forEach((childNode, key) => {
        let componentFound = false;
        // If element has a parsetoken and hookid, it is a dynamic component
        const parseToken = this.platform.getAttribute(childNode, 'parsetoken');

        if (
          parseToken !== null &&
          parseToken === token &&
          this.platform.getAttribute(childNode, 'hookid')
        ) {
          const hookId = parseInt(this.platform.getAttribute(childNode, 'hookid')!, 10);
          if (hookIndex.hasOwnProperty(hookId)) {
            treeLevel.push({
              componentRef: hookIndex[hookId].componentRef!,
              componentSelector: this.platform.getTagName(childNode).toLowerCase(),
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
