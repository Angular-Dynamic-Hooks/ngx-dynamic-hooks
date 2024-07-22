import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, ElementRef, DoCheck, AfterViewChecked, Output, EventEmitter, Injector, Optional, Inject, SimpleChanges, EnvironmentInjector } from '@angular/core';
import { HookIndex, Hook, ParseResult } from '../interfacesPublic';
import { HookParser, LoadedComponent } from '../interfacesPublic';
import { DynamicHooksService } from '../services/dynamicHooksService';
import { HookParserEntry } from '../services/settings/parserEntry';
import { ComponentUpdater } from '../services/core/componentUpdater';
import { AutoPlatformService } from '../services/platform/autoPlatformService';
import { ParseOptions, getParseOptionDefaults } from '../../public-api';

/**
* Explanation in a nutshell:
*  1. A dynamic piece of content is passed in as @Input() and an array of parsers is retrieved either as @Input() or from the global settings.
*  2. The content is given to all registered parsers who will find their respective hooks. The hooks are then replaced/marked as hook anchor elements.
*  3. The corresponding components for each hook are dynamically loaded into the previously created anchor elements as fully-functional Angular components via createComponent().
*  4. @Inputs() & @Outputs() for the components are read from the hooks, passed along and automatically updated according to each parser's internal logic.
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
export class DynamicHooksComponent implements DoCheck, OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() content: any = null;
  @Input() context: any = null;
  @Input() globalParsersBlacklist: string[]|null = null;
  @Input() globalParsersWhitelist: string[]|null = null;
  @Input() parsers: HookParserEntry[]|null = null;
  @Input() options: ParseOptions|null = null;
  @Output() componentsLoaded: EventEmitter<LoadedComponent[]> = new EventEmitter();
  hookIndex: HookIndex = {};
  activeOptions: ParseOptions = getParseOptionDefaults();
  activeParsers: HookParser[] = [];
  token = Math.random().toString(36).substring(2, 12);
  initialized: boolean = false;

  constructor(
    private hostElement: ElementRef,
    private dynamicHooksService: DynamicHooksService,
    private componentUpdater: ComponentUpdater,
    private platformService: AutoPlatformService,
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
    this.platformService.setInnerContent(this.hostElement.nativeElement, '');
    this.hookIndex = {};
    this.activeOptions = getParseOptionDefaults();
    this.activeParsers = [];
    this.initialized = false;
  }

  /**
   * The main method of this component to initialize it
   *
   * @param content - The input content to parse
   */
  parse(content: any): void {
    this.dynamicHooksService.parse(
      content,
      this.parsers,
      this.context,
      this.options,
      this.globalParsersBlacklist,
      this.globalParsersWhitelist,
      this.hostElement.nativeElement,
      this.hookIndex,
      this.environmentInjector,
      this.injector
    ).subscribe((parseResult: ParseResult) => {
      // hostElement and hookIndex are automatically filled
      this.activeParsers = parseResult.usedParsers;
      this.activeOptions = parseResult.usedOptions;
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
