import { Injectable } from '@angular/core';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings, HookFinder, ComponentConfig } from '../../testing-api';
import { MultiTagTestComponent } from '../components/multiTagTest/multiTagTest.c';

@Injectable({
  providedIn: 'root'
})
export class GenericMultiTagStringParser implements HookParser {
  name: string = 'GenericMultiTagStringParser';
  component: ComponentConfig = MultiTagTestComponent;
  // Callbacks that you can overwrite for testing
  onFindHooks: (content: string, context: any) => HookPosition[] = (content, context) => {
    return this.hookFinder.find(content, /\[multitag-string\]/g, /\[\/multitag-string\]/g);
  };
  onLoadComponent: (hookId: number, hookValue: HookValue, context: any, childNodes: Array<Element>) => HookComponentData = (hookId, hookValue, context, childNodes) => {
    return {
      component: this.component
    };
  }
  onGetBindings: (hookId: number, hookValue: HookValue, context: any) => HookBindings = (hookId, hookValue, context) => {
    return {};
  }

  constructor(private hookFinder: HookFinder) {
  }

  public findHooks(content: string, context: any): Array<HookPosition> {
    return this.onFindHooks(content, context);
  }

  public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Array<Element>): HookComponentData {
    return this.onLoadComponent(hookId, hookValue, context, childNodes);
  }

  public getBindings(hookId: number, hookValue: HookValue, context: any): HookBindings {
    return this.onGetBindings(hookId, hookValue, context);
  }
}
