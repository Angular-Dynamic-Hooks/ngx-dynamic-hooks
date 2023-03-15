import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings } from '../../testing-api';
import { matchAll } from '../../testing-api';
import { Injectable } from '@angular/core';
import { MultiTagTestComponent } from '../components/multiTagTest/multiTagTest.c';
import { HookFinder } from '../../testing-api';
import { SelectorHookFinder } from '../../testing-api';

/**
 * This parsers serves to test configuring parsers that are classes or instances
 */
@Injectable()
export class EnclosingCustomParser implements HookParser {
  name: string = 'EnclosingCustomParser';
  component = MultiTagTestComponent;

  constructor(private hookFinder: HookFinder, private selectorFinder: SelectorHookFinder) {
  }

  public findHooks(content: string, context: any): Array<HookPosition> {
    const openingTag = /<div data-attribute-level1>/g;
    const closingTag = /<\/div>/g;

    return this.hookFinder.findEnclosingHooks(content, openingTag, closingTag);
  }

  public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Array<Element>): HookComponentData {
    return {
      component: this.component,
      injector: undefined
    };
  }

  public getBindings(hookId: number, hookValue: HookValue, context: any): HookBindings {
    return {};
  }
}
