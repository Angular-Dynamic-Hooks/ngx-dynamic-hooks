import { ComponentFactoryResolver, Injectable } from '@angular/core';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings } from '../testing-api';
import { GenericSelectorFinder } from '../testing-api';
import { SingleTagTestComponent } from '../components/singleTag/singleTagTest.c';

/**
 * This parser serves to test configuring parsers that are services
 */
@Injectable()
export class ServiceTestParser implements HookParser {
  name: string = 'ServiceTestParser';
  component = SingleTagTestComponent;

  constructor(private genericSelectorFinder: GenericSelectorFinder, private cfr: ComponentFactoryResolver) {
  }

  public findHooks(text: string, context: {[key: string]: any}): Array<HookPosition> {
    const selector = 'dynhooks-serviceparsercomponent';
    return this.genericSelectorFinder.findSingleTagSelectors(text, selector);
  }

  public loadHook(hookId: number, hookValue: HookValue, context: {[key: string]: any}, childNodes: Array<Element>): HookComponentData {
    return {
      component: this.component,
      injector: undefined
    };
  }

  public updateBindings(hookId: number, hookValue: HookValue, context: {[key: string]: any}): HookBindings {
    return {};
  }
}
