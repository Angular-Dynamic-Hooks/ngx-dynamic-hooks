import { ComponentFactoryResolver, Injectable } from '@angular/core';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings } from '../testing-api';
import { SelectorHookFinder } from '../testing-api';
import { SingleTagTestComponent } from '../components/singleTag/singleTagTest.c';

/**
 * This parser serves to test configuring parsers that are services
 */
@Injectable()
export class ServiceTestParser implements HookParser {
  name: string = 'ServiceTestParser';
  component = SingleTagTestComponent;

  constructor(private selectorFinder: SelectorHookFinder, private cfr: ComponentFactoryResolver) {
  }

  public findHooks(content: string, context: any): Array<HookPosition> {
    const selector = 'dynhooks-serviceparsercomponent';
    return this.selectorFinder.findStandaloneSelectors(content, selector);
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
