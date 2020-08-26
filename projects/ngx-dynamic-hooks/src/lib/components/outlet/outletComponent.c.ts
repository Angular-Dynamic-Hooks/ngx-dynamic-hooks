import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, ElementRef, Inject, DoCheck, AfterViewChecked, Output, EventEmitter, Optional } from '@angular/core';

import { HookIndex, Hook } from '../../interfaces';
import { HookParser, LoadedComponent } from '../../interfacesPublic';
import { OutletOptions, outletOptionDefaults } from './options/options';
import { DYNAMICHOOKS_GLOBALSETTINGS, DynamicHooksGlobalSettings } from '../../globalSettings';
import { HooksReplacer } from './services/hooksReplacer';
import { ComponentCreator } from './services/componentCreator';
import { ParserEntryResolver } from './options/parserEntryResolver';
import { first } from 'rxjs/operators';
import { HookParserEntry } from './options/parserEntry';
import { OptionsResolver } from './options/optionsResolver';
import { ComponentUpdater } from './services/componentUpdater';

/**
 * The main component of the DynamicHooksModule. Accepts a string of text and replaces all hooks inside of it with dynamically created
 * components that behave just like any other Angular component.
 *
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
 *     Angular components via ComponentFactory.create().
 *
 *  5. Any @Inputs() & @Outputs() for the components will be registered with them and automatically updated on following change detection runs.
 */

@Component({
  selector: 'ngx-dynamic-hooks',
  template: '',
  styles: []
})
export class OutletComponent implements DoCheck, OnInit, OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() content: string;
  @Input() context: any;
  @Input() globalParsersBlacklist: Array<string>;
  @Input() globalParsersWhitelist: Array<string>;
  @Input() parsers: Array<HookParserEntry>;
  @Input() options: OutletOptions;
  @Output() componentsLoaded: EventEmitter<LoadedComponent[]> = new EventEmitter();
  hookIndex: HookIndex = {};
  activeOptions: OutletOptions = outletOptionDefaults;
  activeParsers: Array<HookParser> = [];
  token = Math.random().toString(36).substr(2, 10);
  initialized: boolean = false;

  // Lifecycle methods
  // ----------------------------------------------------------------------

  constructor(
    private hostElement: ElementRef,
    @Optional() @Inject(DYNAMICHOOKS_GLOBALSETTINGS) private globalSettings: DynamicHooksGlobalSettings,
    private parserEntryResolver: ParserEntryResolver,
    private optionsResolver: OptionsResolver,
    private hooksReplacer: HooksReplacer,
    private componentCreator: ComponentCreator,
    private componentUpdater: ComponentUpdater
  ) {}

  ngDoCheck(): void {
    // Update bindings on every change detection run?
    if (this.initialized && !this.activeOptions.updateOnPushOnly) {
      this.refresh(false);
    }
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes): void {
    // If text or options change, reset and parse from scratch
    if (
      changes.hasOwnProperty('content') ||
      changes.hasOwnProperty('globalParsersBlacklist') ||
      changes.hasOwnProperty('globalParsersWhitelist') ||
      changes.hasOwnProperty('parsers') ||
      changes.hasOwnProperty('options')
    ) {
      this.reset();
      this.loadOptions();
      this.loadParsers();
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
    if (this.hookIndex) {
      // Unsubscribe from hook outputs
      for (const hook of Object.values(this.hookIndex)) {
        for (const sub of Object.values(hook.outputSubscriptions)) {
          if (sub) {
            sub.unsubscribe();
          }
        }
      }

      // Destroy dynamic components
      for (const hookIndexEntry of Object.values(this.hookIndex)) {
        if (hookIndexEntry.componentRef) {
          hookIndexEntry.componentRef.destroy();
        }
      }
    }

    // Reset state
    this.hostElement.nativeElement.innerHTML = '';
    this.hookIndex = {};
    this.activeOptions = undefined;
    this.activeParsers = undefined;
    this.initialized = false;
  }

  /**
   * Loads the relevant outlet options
   */
  loadOptions(): void {
    // If local
    if (this.options) {
      this.activeOptions = this.optionsResolver.resolve(this.options);
    // If global
    } else if (this.globalSettings && this.globalSettings.hasOwnProperty('globalOptions')) {
      this.activeOptions = this.optionsResolver.resolve(this.globalSettings.globalOptions);
    // If none given
    } else {
      this.activeOptions = outletOptionDefaults;
    }
  }

  /**
   * Loads the relevant parser configuration
   */
  loadParsers(): void {
    // If local
    if (this.parsers) {
      this.activeParsers = this.parserEntryResolver.resolve(this.parsers);
    // If global
    } else if (this.globalSettings && this.globalSettings.hasOwnProperty('globalParsers')) {
      this.activeParsers = this.parserEntryResolver.resolve(this.globalSettings.globalParsers, this.globalParsersBlacklist, this.globalParsersWhitelist);
    // If none given
    } else {
      this.activeParsers = [];
    }
  }

  /**
   * The main method of this component to initialize it
   *
   * @param content - The input content to parse
   */
  parse(content: string): void {
    if (!content || typeof content !== 'string') {
      return;
    }

    // Convert input HTML entities?
    if (this.activeOptions.convertHTMLEntities) {
      content = this.hooksReplacer.convertHTMLEntities(content);
    }

    // Replace hooks with component selector elements
    const result = this.hooksReplacer.replaceHooksWithNodes(content, this.context, this.activeParsers, this.token, this.activeOptions);
    content = result.content;
    this.hookIndex = result.hookIndex;

    // Parse HTML
    this.hostElement.nativeElement.innerHTML = content;

    // Dynamically create components in component selector elements
    this.componentCreator.init(this.hostElement.nativeElement, this.hookIndex, this.token, this.context, this.activeOptions)
    .pipe(first())
    .subscribe((allComponentsLoaded: boolean) => {
      this.initialized = true;

      // Return all loaded components
      const loadedComponents: LoadedComponent[] = Object.values(this.hookIndex).map((hook: Hook) => {
        return {
          hookId: hook.id,
          hookValue: hook.value,
          hookParser: hook.parser,
          componentRef: hook.componentRef
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
    this.componentUpdater.refresh(this.hookIndex, this.context, this.activeOptions, triggerOnDynamicChanges);
  }
}
