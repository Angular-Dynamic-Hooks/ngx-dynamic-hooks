import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings, HookFinder } from '../../testing-api';
import { matchAll } from '../../testing-api';
import { SingleTagTestComponent } from '../components/singleTag/singleTagTest.c';

/**
 * This parsers serves to test configuring parsers that are classes or instances
 */
export class NonServiceTestParser implements HookParser {
  name: string = 'NonServiceTestParser';
  component = SingleTagTestComponent;

  constructor() {
  }

  public findHooks(content: string, context: any): Array<HookPosition> {
    const result: HookPosition[] = [];

    // Find all hooks
    const openingTagMatches = matchAll(content, /customhook/g);

    for (const match of openingTagMatches) {
      result.push({
        openingTagStartIndex: match.index,
        openingTagEndIndex: match.index + match[0].length,
        closingTagStartIndex: null,
        closingTagEndIndex: null,
      });
    }

    return result;
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
