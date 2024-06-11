import { Injectable, reflectComponentType } from '@angular/core';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings, matchAll, HookFinder } from '../../testing-api';
import { TagHookFinder } from '../../testing-api';
import { NgContentTestComponent } from '../components/ngContentTest/ngContentTest.c';

/**
 * This parser always returns unique static content from loadHook instead of the actual childNodes,
 * to test that the actual childNodes are correctly replaced.
 */

@Injectable({
  providedIn: 'root'
})
export class CustomContentParser implements HookParser {
  name: string = 'CustomContentParser';
  component = NgContentTestComponent;

  constructor(private hookFinder: HookFinder) {
  }

  public findHooks(content: string, context: any): Array<HookPosition> {
    return this.hookFinder.findEnclosingHooks(content, /\[customcontent\]/g, /\[\/customcontent\]/g);
  }

  public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Array<Element>): HookComponentData {
    const customSpan = document.createElement('span');
    customSpan.innerHTML = 'this should be highlighted';

    const customH2 = document.createElement('h2');
    customH2.innerHTML = 'This is the title';

    const customDiv = document.createElement('div');
    customDiv.innerHTML = 'Some random content';

    const content = [];
    content[0] = [customSpan];
    content[2] = [customH2, customDiv];

    return {
      component: this.component,
      injector: undefined,
      content: content
    };
  }

  public getBindings(hookId: number, hookValue: HookValue, context: any): HookBindings {
    return {};
  }
}
