import { Injectable } from '@angular/core';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings, HookFinder, ComponentConfig } from '../../testing-api';
import { MultiTagTestComponent } from '../components/multiTagTest/multiTagTest.c';

@Injectable({
  providedIn: 'root'
})
export class GenericElementParser implements HookParser {
  name: string = 'GenericElementParser';
  component: ComponentConfig = MultiTagTestComponent;
  // Callbacks that you can overwrite for testing
  onFindHookElements: (contentElement: Element, context: any) => any[] = (contentElement, context) => {
    return Array.from(contentElement.querySelectorAll('multitag-element'));
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

  public findHookElements(contentElement: Element, context: any): any[] {
    return this.onFindHookElements(contentElement, context);
  }

  public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Array<Element>): HookComponentData {
    return this.onLoadComponent(hookId, hookValue, context, childNodes);
  }

  public getBindings(hookId: number, hookValue: HookValue, context: any): HookBindings {
    return this.onGetBindings(hookId, hookValue, context);
  }
}
