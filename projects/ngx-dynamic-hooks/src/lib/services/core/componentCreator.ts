import { Inject, Injector, PLATFORM_ID, ApplicationRef, Injectable, createComponent, EnvironmentInjector, reflectComponentType } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { combineLatest, ReplaySubject, of } from 'rxjs';
import { first, mergeMap, tap, catchError } from 'rxjs/operators';

import { Hook, HookIndex } from '../../interfacesPublic';
import { DynamicContentChild, ComponentConfig, LazyLoadComponentConfig } from '../../interfacesPublic';
import { ComponentUpdater } from './componentUpdater';
import { AutoPlatformService } from '../platform/autoPlatformService';
import { anchorAttrHookId, anchorAttrParseToken, anchorElementTag, voidElementTags } from '../../constants/core';
import { ParseOptions } from '../settings/options';
import { Logger } from '../utils/logger';

/**
 * The service responsible for dynamically creating components for all found Hooks
 */
@Injectable({
  providedIn: 'root'
})
export class ComponentCreator {

  constructor(
    @Inject(PLATFORM_ID) private platformId: string,
    private appRef: ApplicationRef,
    private componentUpdater: ComponentUpdater, 
    private platformService: AutoPlatformService,
    private logger: Logger
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
  init(contentElement: any, hookIndex: HookIndex, token: string, context: any, options: ParseOptions, environmentInjector: EnvironmentInjector, injector: Injector): ReplaySubject<boolean> {
    const allComponentsLoaded: ReplaySubject<boolean> = new ReplaySubject(1);
    const componentLoadSubjects = [];
    const anchorElements: {[key: string]: any} = {};

    // If no hooks found, no need to progress further
    if (Object.keys(hookIndex).length === 0) {
      allComponentsLoaded.next(true);
      return allComponentsLoaded;
    }

    // Check anchor elements in order of appearance and prepare loading components
    for (let anchorElement of this.platformService.querySelectorAll(contentElement, `[${anchorAttrHookId}][${anchorAttrParseToken}]`)) {
      const hookId = parseInt(this.platformService.getAttribute(anchorElement, anchorAttrHookId)!);
      
      // Discard hook if anchor element was removed by previous hook in loop via ng-content replacement
      if (this.platformService.querySelectorAll(contentElement, `[${anchorAttrHookId}="${hookId}"][${anchorAttrParseToken}="${token}"]`).length === 0) {
        delete hookIndex[hookId];
        continue;
      }

      const hook = hookIndex[hookId];
      hook.data = hook.parser.loadComponent(hook.id, hook.value, context, this.platformService.getChildNodes(anchorElement), options);
      hook.isLazy = hook.data.component.hasOwnProperty('importPromise') && hook.data.component.hasOwnProperty('importName');

      // Skip loading lazy components during SSR
      if (!isPlatformBrowser(this.platformId) && hook.isLazy) {
        delete hookIndex[hookId];
        continue;
      }

      // If anchor element is a void element and no custom host element specified, fallback to default anchor element
      if (!hook.data.hostElementTag && voidElementTags.includes(this.platformService.getTagName(anchorElement).toLowerCase())) {
        hook.data.hostElementTag = anchorElementTag;
      }

      /*
      * Replace anchor element with custom one, if desired. Do this before loading any components.
      * 
      * Explanation: 
      * When a component is created, one of its projectableNodes happens to be another components anchor element, but the parent component doesn't render the anchor right away
      * (due to *ngIf, for example), you can't replace that anchor anymore as it is now tracked in Angular's memory as a reference. And that exact reference will 
      * be rendered when the component's *ngIf eventually resolved to true. So need to process all custom host element requests before loading components.
      */
      if (hook.data.hostElementTag) {
        anchorElement = this.useCustomHostElement(anchorElement, hook.data.hostElementTag);
        hook.value.element = anchorElement;
      }

      // Insert child content according to hook.data immediately
      // This has the benefit that if the child content is custom, the next iterations of this loop will throw out all hooks whose placeholder elements 
      // can no longer be found (b/c they were in the discarded child content) so their component won't be unnecessarily loaded.
      this.createContentSlotElements(anchorElement, hook, token);

      anchorElements[hookId] = anchorElement;
    }

    // For safety: Remove hooks from index whose anchor element for whatever reason could no longer be found
    const foundHookIds = Object.keys(anchorElements).map(hookId => parseInt(hookId));
    for (const [hookId, hook] of Object.entries(hookIndex)) {
      if (!foundHookIds.includes(parseInt(hookId))) {
        this.logger.warn(['Error when trying to load components - The anchor element for the following hook was found initially, but could not be found again for loading the component. Ignoring.', hook], options);
        delete hookIndex[hookId];
      }
    }

    // Load components
    for (const [hookId, anchorElement] of Object.entries(anchorElements)) {
      const hook = hookIndex[hookId];

      // Start with of(true) to catch errors from loadComponentClass in the observable stream as well
      componentLoadSubjects.push(of(true)
        // Load component class first (might be lazy-loaded)
        .pipe(mergeMap(() => this.loadComponentClass(hook.data!.component)))
        .pipe(tap((compClass) => {
          // Get projectableNodes from the content slots
          const projectableNodes = this.extractContentSlotElements(anchorElement, token);
          // Instantiate component
          this.createComponent(hook, context, anchorElement, projectableNodes, options, compClass, environmentInjector, injector);
        }))
        // If could not be created, remove from hookIndex
        .pipe(catchError((e) => {
          this.logger.error([e.stack], options);
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
        const contentChildren: DynamicContentChild[] = [];
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
      for (const anchorElement of Object.values(anchorElements)) {
        this.platformService.removeAttribute(anchorElement, anchorAttrHookId);
        this.platformService.removeAttribute(anchorElement, anchorAttrParseToken);
        this.platformService.removeAttribute(anchorElement, 'ng-version');
      }

      // Done!
      allComponentsLoaded.next(true);
    });

    return allComponentsLoaded;
  }

  // DOM manipulation
  // ----------------------------------------------------------------------------------------------------------------

  /**
   * Replaces a default anchor element with a custom element 
   * 
   * @param anchorElement - The default component anchor element
   * @param customTagName - The custom tag that should be used instead
   */
  useCustomHostElement(anchorElement: any, customTagName: string): any {
    const customHostElement = this.platformService.createElement(customTagName);

    // Move attributes to selector
    this.platformService.setAttribute(customHostElement, anchorAttrHookId, this.platformService.getAttribute(anchorElement, anchorAttrHookId)!);
    this.platformService.setAttribute(customHostElement, anchorAttrParseToken, this.platformService.getAttribute(anchorElement, anchorAttrParseToken)!);
    this.platformService.removeAttribute(anchorElement, anchorAttrHookId);
    this.platformService.removeAttribute(anchorElement, anchorAttrParseToken);

    // Move child nodes to selector
    const childNodes = this.platformService.getChildNodes(anchorElement);
    for (const node of childNodes) {
      this.platformService.appendChild(customHostElement, node);
    }

    // Replace anchorElement
    this.platformService.insertBefore(this.platformService.getParentNode(anchorElement)!, customHostElement, anchorElement);
    this.platformService.removeChild(this.platformService.getParentNode(anchorElement)!, anchorElement);

    return customHostElement;
  }

  /**
   * Creates a content slot dom element for each ng-content tag of the dynamically loaded component.
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
  extractContentSlotElements(componentHostElement: any, token: string): any[][] {
    // Resolve ng-content from content slots
    const projectableNodes: any[][] = [];
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
  createComponent(hook: Hook, context: any, componentHostElement: any, projectableNodes: any[][], options: ParseOptions, compClass: new(...args: any[]) => any, environmentInjector: EnvironmentInjector, injector: Injector): void {
    
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

    // Optionally trigger HTML events when outputs emit
    this.mapOutputsToHTMLEvents(hook, options);

    // Pass in initial bindings
    this.componentUpdater.updateBindings(hook, context, options);

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

  // Other
  // ----------------------------------------------------------------------------------------------------------------

  mapOutputsToHTMLEvents(hook: Hook, options: ParseOptions) {
    const compMeta = reflectComponentType(hook.componentRef!.componentType)!;

    for (const outputObject of compMeta.outputs) {
      const outputName = options.ignoreOutputAliases ? outputObject.propName : outputObject.templateName;
      
      // Trigger events, if requested
      hook.htmlEventSubscriptions[outputName] = hook.componentRef!.instance[outputObject.propName].subscribe((event: any) => {
        if (options.triggerDOMEvents) {
          this.platformService.dispatchEvent(hook.componentRef?.location.nativeElement, outputName, event);
        }
      });
    }
  }

  /**
   * Find all components that would be the ContentChildren of a dynamic component and returns them in a hierarchical tree object
   * Important: This function depends on the component selector attributes 'parsetoken' and 'hookid' not being removed yet
   *
   * @param node - The HTML node to parse
   * @param treeLevel - The current tree level of DynamicContentChildren (for recursiveness)
   * @param hookIndex - The current hookIndex
   * @param token - The current parseToken
   */
  findContentChildren(node: any, treeLevel: DynamicContentChild[] = [], hookIndex: HookIndex, token: string): void {
    const childNodes = this.platformService.getChildNodes(node);
    if (childNodes != undefined && childNodes.length > 0) {
      childNodes.forEach((childNode, key) => {
        let componentFound = false;
        // If element has a parsetoken and hookid, it is a dynamic component
        const parseToken = this.platformService.getAttribute(childNode, anchorAttrParseToken);

        if (
          parseToken !== null &&
          parseToken === token &&
          this.platformService.getAttribute(childNode, anchorAttrHookId)
        ) {
          const hookId = parseInt(this.platformService.getAttribute(childNode, anchorAttrHookId)!, 10);
          if (hookIndex.hasOwnProperty(hookId)) {
            treeLevel.push({
              componentRef: hookIndex[hookId].componentRef!,
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
