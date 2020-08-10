import { ComponentFactoryResolver, Injectable } from '@angular/core';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings } from '../testing-api';
import { GenericSelectorFinder } from '../testing-api';
import { NgContentTestComponent } from '../components/ngContentTest/ngContentTest.c';

/**
 * This parser always returns unique static content from loadHook instead of the actual childNodes,
 * to test that the actual childNodes are correctly replaced.
 */

@Injectable()
export class NgContentTestParser implements HookParser {
  name: string = 'NgContentTestComponentParser';
  component = NgContentTestComponent;

  constructor(private genericSelectorFinder: GenericSelectorFinder, private cfr: ComponentFactoryResolver) {
  }

  public findHooks(text: string, context: {[key: string]: any}): Array<HookPosition> {
    const selector = this.cfr.resolveComponentFactory(this.component).selector;
    const bracketStyle = {opening: '<', closing: '>'};
    return this.genericSelectorFinder.findMultiTagSelectors(text, selector, bracketStyle);
  }

  public loadHook(hookId: number, hookValue: HookValue, context: {[key: string]: any}, childNodes: Array<Element>): HookComponentData {
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

  public updateBindings(hookId: number, hookValue: HookValue, context: {[key: string]: any}): HookBindings {
    return {};
  }
}
