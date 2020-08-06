import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, ElementRef, ComponentFactoryResolver, Inject, DoCheck, AfterViewChecked, Output, EventEmitter, Optional, Renderer2, SkipSelf } from '@angular/core';

import { HookIndex } from '../../interfaces';
import { HookParser } from '../../interfacesPublic';
import { OutletOptions, outletOptionDefaults } from './options/options';
import { DYNAMICCOMPONENTHOOKS_GLOBALSETTINGS, DynamicComponentHooksGlobalSettings } from '../../globalSettings';
import { HooksReplacer } from './services/hooksReplacer';
import { ComponentCreator } from './services/componentCreator';
import { ParserEntryResolver } from './options/parserEntryResolver';
import { first } from 'rxjs/operators';
import { HookParserEntry } from './options/parserEntry';
import { OptionsResolver } from './options/optionsResolver';
import { ComponentUpdater } from './services/componentUpdater';

/**
 * Short explanation:
 *
 * 1. A dynamic text is passed in via @Input(). On init, this component will then hand this dynamicText to all parsers from supportedParsers, who will find the shortcode/pattern they are
 * responsible for and each return an Array<DynamicTextSegment>.
 *
 * 2. This component then has to make sense of these individual results and combine them into the final textSegments Array<DynamicTextSegment> which includes everything that was found.
 *
 * 3. The template will render the textSegments-array automatically and place an anchor at each component location. In AfterViewInit, this component then calls loadComponentsForAnchors,
 * which will dynamically create and insert the respective AdapterComponents into their anchor positions and pass along the whole shortcode to analyze.
 *
 * 4. From then on out, it is the AdapterComponents responsibility to parse all required values from its shortcode and properly initialize their respective components with them.
 *
 * Alternative: You can also interpret strings as literal Angular templates via this method: https://stackoverflow.com/a/44082399/3099523
 * However, this allows no control over what Angular features are allowed and which aren't. When used in comments, users could write their own fully-functional templates and use all
 * declared components of my app. Via my DynamicTextComponent, you have fine-grained control over what parsers should be active / shortcodes are allowed and what arguments can be
 * passed to them.
 */

@Component({
  selector: 'ngx-dynamic-component-hooks',
  template: '',
  styles: []
})
export class OutletComponent implements DoCheck, OnInit, OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() content: string;
  @Input() context: {[key: string]: any};
  @Input() globalParsersBlacklist: Array<string>;
  @Input() globalParsersWhitelist: Array<string>;
  @Input() parsers: Array<HookParserEntry>;
  @Input() options: OutletOptions;
  @Output() componentsLoaded: EventEmitter<boolean> = new EventEmitter();
  hookIndex: HookIndex = {};
  activeOptions: OutletOptions = outletOptionDefaults;
  activeParsers: Array<HookParser> = [];
  token = Math.random().toString(36).substr(2, 10);
  initialized: boolean = false;

  // Lifecycle methods
  // ----------------------------------------------------------------------

  constructor(
    private hostElement: ElementRef,
    @Optional() @Inject(DYNAMICCOMPONENTHOOKS_GLOBALSETTINGS) private globalSettings: DynamicComponentHooksGlobalSettings,
    private parserEntryResolver: ParserEntryResolver,
    private optionsResolver: OptionsResolver,
    private hooksReplacer: HooksReplacer,
    private componentCreator: ComponentCreator,
    private componentUpdater: ComponentUpdater
  ) {
    console.warn('Something is not quite right.');
  }

  ngDoCheck(): void {
    if (this.initialized && this.activeOptions.changeDetectionStrategy.toLowerCase() === 'default') {
      this.componentUpdater.refresh(this.hookIndex, this.context, this.activeOptions, false);
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
      this.componentUpdater.refresh(this.hookIndex, this.context, this.activeOptions, true);
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
   * The main function of this component
   *
   * Takes the text input, replaces all found hooks with placeholders and builds a hookIndex,
   * parses the text via the native DOMParser, replaces the placeholders with the actual selector
   * elements and dynamically loads the desired components into them.
   *
   * @param text - The input text to parse
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
    content = result.text;
    this.hookIndex = result.hookIndex;

    // Parse HTML
    this.hostElement.nativeElement.innerHTML = content;

    // Dynamically create components in component selector elements
    this.componentCreator.init(this.hostElement.nativeElement, this.hookIndex, this.token, this.context, this.activeOptions)
    .pipe(first())
    .subscribe((allComponentsLoaded: boolean) => {
      this.initialized = true;
      this.componentsLoaded.emit(true);
      console.log('HookIndex:', this.hookIndex);
    });
  }
}
