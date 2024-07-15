import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, ElementRef, DoCheck, AfterViewChecked, Output, EventEmitter, Injector, Optional, Inject, SimpleChanges, EnvironmentInjector, reflectComponentType, ComponentRef } from '@angular/core';
import { HookIndex, Hook, ParseResult, HookComponentData, HookValue, HookBindings } from '../interfacesPublic';
import { HookParser, LoadedComponent } from '../interfacesPublic';
import { DynamicHooksService } from '../services/dynamicHooksService';
import { ComponentUpdater } from '../services/core/componentUpdater';
import { AutoPlatformService } from '../services/platform/autoPlatformService';
import { ParseOptions, getParseOptionDefaults } from '../../public-api';
import { anchorElementTag } from '../constants/core';

export interface DynamicHooksSingleOptions {
  updateOnPushOnly?: boolean;
  compareInputsByValue?: boolean;
  compareOutputsByValue?: boolean;
  compareByValueDepth?: number;
  ignoreInputAliases?: boolean;
  ignoreOutputAliases?: boolean;
  acceptInputsForAnyProperty?: boolean;
  acceptOutputsForAnyObservable?: boolean;
}

@Component({
  selector: 'ngx-dynamic-single',
  template: '',
  standalone: true,
  styles: []
})
export class DynamicSingleComponent implements DoCheck, OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() component: (new(...args: any[]) => any)|null = null;
  @Input() inputs: {[key:string]: any} = {};
  @Input() outputs: {[key:string]: any} = {};
  @Input() options: DynamicHooksSingleOptions = {};
  @Output() componentLoaded: EventEmitter<ComponentRef<any>> = new EventEmitter();
  parseResult: ParseResult|null = null;
  parseOptions: ParseOptions = {};

  constructor(
    private hostElement: ElementRef,
    private platformService: AutoPlatformService,
    private dynamicHooksService: DynamicHooksService,
    private componentUpdater: ComponentUpdater
  ) {
  }

  ngDoCheck(): void {
    // Update on every change detection run?
    if (!this.parseOptions.updateOnPushOnly) {
      this.updateComponent();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If component changed, reset and load from scratch
    if (
      changes.hasOwnProperty('component')
    ) {
      this.reset();
      this.parseOptions = {...getParseOptionDefaults(), ...this.options};
      this.loadComponent();

    // If anything else changed, just refresh inputs/outputs
    } else if (
      changes.hasOwnProperty('inputs') ||
      changes.hasOwnProperty('outputs') || 
      changes.hasOwnProperty('options')
    ) {
      
      this.parseOptions = {...getParseOptionDefaults(), ...this.options};
      this.updateComponent();
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

  reset() {
    if (this.parseResult) {
      this.dynamicHooksService.destroy(this.parseResult.hookIndex);
    }

    this.platformService.setInnerContent(this.hostElement.nativeElement, '');
    this.parseResult = null;
    this.parseOptions = {};
  }

  loadComponent() {
    if (this.component) {
      const compMeta = reflectComponentType(this.component);

      if (!compMeta) {
        throw new Error('Provided component class input is not a valid Angular component.');
      }

      // Try to use component selector as hostElement. Otherwise default to standard anchor.
      let selector;
      let componentHostElement;
      try {
        selector = compMeta.selector;
        componentHostElement = this.platformService.createElement(selector);
      } catch (e) {
        selector = anchorElementTag;
        componentHostElement = this.platformService.createElement(anchorElementTag);
      }
      this.platformService.clearChildNodes(this.hostElement.nativeElement);
      this.platformService.appendChild(this.hostElement.nativeElement, componentHostElement);

      // Create parser that finds created hostElement as hook and loads requested component into it
      const parser = this.createAdHocParser(selector);

      this.dynamicHooksService.parse(this.hostElement.nativeElement, {}, null, null, [parser], this.parseOptions)
      .subscribe(parseResult => {
        this.parseResult = parseResult;
        this.componentLoaded.next(parseResult.hookIndex[1].componentRef!);
      });
    }
  }

  createAdHocParser(selector: string): (new(...args: any[]) => HookParser) {
    const that = this;

    class AdHocSingleComponentParser implements HookParser {

      findHookElements(contentElement: any, context: any): any[] {
        return that.platformService.querySelectorAll(contentElement, selector);
      }

      loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Node[]): HookComponentData {
        return {
          component: that.component!
        }
      }

      getBindings(hookId: number, hookValue: HookValue, context: any): HookBindings {
        return {
          inputs: that.inputs,
          outputs: that.outputs
        }
      }
    }

    return AdHocSingleComponentParser;
  }

  updateComponent() {
    if (this.parseResult) {
      this.componentUpdater.refresh(this.parseResult.hookIndex, {}, this.parseOptions, false);
    }
  }

}
