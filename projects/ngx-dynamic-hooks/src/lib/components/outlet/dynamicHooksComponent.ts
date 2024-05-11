import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, ElementRef, DoCheck, AfterViewChecked, Output, EventEmitter, Injector, Optional, Inject, SimpleChanges, EnvironmentInjector } from '@angular/core';
import { HookIndex, Hook } from '../../interfacesPublic';
import { HookParser, LoadedComponent, OutletParseResult } from '../../interfacesPublic';
import { OutletOptions, outletOptionDefaults } from './settings/options';
import { DynamicHooksService } from './services/dynamicHooksService';
import { HookParserEntry } from './settings/parserEntry';
import { ComponentUpdater } from './services/componentUpdater';
import { PlatformService } from '../../platform/platformService';
import { DYNAMICHOOKS_FORROOTCHECK } from '../../interfaces';

/**
* Explanation in a nutshell:
*
*  1. A dynamic string of content is passed in as @Input() and an array of parsers is retrieved either as @Input() or from the global settings.
*
*  2. The content is given to all registered parsers who will find their respective hooks. The hooks are then replaced with dynamic component
*     placeholder elements in the content string.
*
*  3. The content string is then parsed by the native browser HTML parser to create a DOM tree, which is then inserted as the innerHTML of the
*     OutletComponent.
*
*  4. The corresponding components for each hook are dynamically loaded into the previously created placeholder elements as fully-functional
*     Angular components via createComponent().
*
*  5. Any @Inputs() & @Outputs() for the components will be registered with them and automatically updated on following change detection runs.
*/

/**
 * The main component of the ngx-dynamic-hooks library. 
 * 
 * Accepts a string of content and replaces all registered hooks inside of it with dynamically-created components that behave just like any other Angular component.
 */
@Component({
  selector: 'ngx-dynamic-hooks',
  template: '',
  standalone: true,
  styles: []
})
export class DynamicHooksComponent implements DoCheck, OnInit, OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() content: string|null = null;
  @Input() context: any = null;
  @Input() globalParsersBlacklist: Array<string>|null = null;
  @Input() globalParsersWhitelist: Array<string>|null = null;
  @Input() parsers: Array<HookParserEntry>|null = null;
  @Input() options: OutletOptions|null = null;
  @Output() componentsLoaded: EventEmitter<LoadedComponent[]> = new EventEmitter();
  hookIndex: HookIndex = {};
  activeOptions: OutletOptions = outletOptionDefaults;
  activeParsers: Array<HookParser> = [];
  token = Math.random().toString(36).substring(2, 12);
  initialized: boolean = false;

  // Lifecycle methods
  // ----------------------------------------------------------------------

  constructor(
    // Just needs to request injecting this to ensure that forRoot was called
    @Optional() @Inject(DYNAMICHOOKS_FORROOTCHECK) private forRootCheck: boolean,
    private hostElement: ElementRef,
    private dynamicHooksService: DynamicHooksService,
    private componentUpdater: ComponentUpdater,
    private platform: PlatformService,
    private environmentInjector: EnvironmentInjector,
    private injector: Injector
  ) {
  }

  ngDoCheck(): void {
    // Update bindings on every change detection run?
    if (!this.activeOptions.updateOnPushOnly) {
      this.refresh(false);
    }
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If text or options change, reset and parse from scratch
    if (
      changes.hasOwnProperty('content') ||
      changes.hasOwnProperty('globalParsersBlacklist') ||
      changes.hasOwnProperty('globalParsersWhitelist') ||
      changes.hasOwnProperty('parsers') ||
      changes.hasOwnProperty('options')
    ) {
      this.reset();
      this.parse(this.content);
      return;

    // If only context changed, just refresh hook inputs/outputs
    } else if (changes.hasOwnProperty('context')) {
      this.refresh(true);
    }
  }

  ngAfterViewInit(): void {
  }

  ngAfterViewChecked(): void {
  }

  ngOnDestroy(): void {
    this.reset();
  }

  // ----------------------------------------------------------------------

  /**
   * Empties the state of this component
   */
  reset(): void {
    this.dynamicHooksService.destroy(this.hookIndex);

    // Reset state
    this.platform.setInnerContent(this.hostElement.nativeElement, '');
    this.hookIndex = {};
    this.activeOptions = outletOptionDefaults;
    this.activeParsers = [];
    this.initialized = false;
  }

  /**
   * The main method of this component to initialize it
   *
   * @param content - The input content to parse
   */
  parse(content: string|null): void {
    this.dynamicHooksService.parse(
      content,
      this.context,
      this.globalParsersBlacklist,
      this.globalParsersWhitelist,
      this.parsers,
      this.options,
      this.hostElement.nativeElement,
      this.hookIndex,
      this.environmentInjector,
      this.injector
    ).subscribe((outletParseResult: OutletParseResult) => {
      // hostElement and hookIndex are automatically filled
      this.activeParsers = outletParseResult.resolvedParsers;
      this.activeOptions = outletParseResult.resolvedOptions;
      this.initialized = true;

      // Return all loaded components
      const loadedComponents: LoadedComponent[] = Object.values(this.hookIndex).map((hook: Hook) => {
        return {
          hookId: hook.id,
          hookValue: hook.value,
          hookParser: hook.parser,
          componentRef: hook.componentRef!
        };
      });
      this.componentsLoaded.emit(loadedComponents);
    });
  }

  /**
   * Updates the bindings for all existing components
   *
   * @param triggerOnDynamicChanges - Whether to trigger the OnDynamicChanges method of dynamically loaded components
   */
  refresh(triggerOnDynamicChanges: boolean): void {
    if (this.initialized) {
      this.componentUpdater.refresh(this.hookIndex, this.context, this.activeOptions, triggerOnDynamicChanges);
    }
  }
}
