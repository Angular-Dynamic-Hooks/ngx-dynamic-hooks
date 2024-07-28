import { Injectable } from '@angular/core';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings, HookFinder, ComponentConfig, ParseOptions } from '../../testing-api';
import { MultiTagTestComponent } from '../components/multiTagTest/multiTagTest.c';

@Injectable({
  providedIn: 'root'
})
export class GenericMultiTagStringParser implements HookParser {
  name: string = 'GenericMultiTagStringParser';
  component: ComponentConfig = MultiTagTestComponent;
  // Callbacks that you can overwrite for testing
  onFindHooks: (content: string, context: any, options: ParseOptions) => HookPosition[] = (content, context, options) => {
    return this.hookFinder.find(content, /\[multitag-string\]/g, /\[\/multitag-string\]/g);
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

  public findHooks(content: string, context: any, options: ParseOptions): Array<HookPosition> {
    return this.onFindHooks(content, context, options);
  }

  public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Array<Element>, options: ParseOptions): HookComponentData {
    return this.onLoadComponent(hookId, hookValue, context, childNodes, options);
  }

  public getBindings(hookId: number, hookValue: HookValue, context: any, options: ParseOptions): HookBindings {
    return this.onGetBindings(hookId, hookValue, context, options);
  }
}
