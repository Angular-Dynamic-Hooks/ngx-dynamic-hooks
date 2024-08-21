import { Injectable } from '@angular/core';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings, HookFinder, ComponentConfig, ParseOptions } from '../../testing-api';
import { MultiTagTestComponent } from '../components/multiTagTest/multiTagTest.c';

@Injectable({
  providedIn: 'root'
})
export class GenericElementParser implements HookParser {
  name: string = 'GenericElementParser';
  component: ComponentConfig = MultiTagTestComponent;
  // Callbacks that you can overwrite for testing
  onFindHookElements: (contentElement: Element, context: any, options: ParseOptions) => any[] = (contentElement, context, options) => {
    return Array.from(contentElement.querySelectorAll('multitag-element'));
  };
  onLoadComponent: (hookId: number, hookValue: HookValue, context: any, childNodes: Array<Element>, options: ParseOptions) => HookComponentData = (hookId, hookValue, context, childNodes, options) => {
    return {
      component: this.component
    };
  }
  onGetBindings: (hookId: number, hookValue: HookValue, context: any, options: ParseOptions) => HookBindings = (hookId, hookValue, context, options) => {
    return {};
  }

  constructor(private hookFinder: HookFinder) {
  }

  public findHookElements(contentElement: Element, context: any, options: ParseOptions): any[] {
    return this.onFindHookElements(contentElement, context, options);
  }

  public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Array<Element>, options: ParseOptions): HookComponentData {
    return this.onLoadComponent(hookId, hookValue, context, childNodes, options);
  }

  public getBindings(hookId: number, hookValue: HookValue, context: any, options: ParseOptions): HookBindings {
    return this.onGetBindings(hookId, hookValue, context, options);
  }
}
