import { HookParser, HookPosition, HookValue, HookData, HookBindings } from '../../lib/interfacesPublic';
import { GenericSelectorFinder } from '../../lib/parsers/genericSelector/services/genericSelectorFinder';
import { NgContentTestComponent } from '../components/ngContentTest/ngContentTest.c';
import { ComponentFactoryResolver, Injectable } from '@angular/core';
import { SingleTagTestComponent } from '../components/singleTag/singleTagTest.c';
import { matchAll } from '../../lib/polyfills/matchAll';

/**
 * This parsers serves to test configuring parsers that are classes or instances
 */
export class NonServiceTestParser implements HookParser {
  name: string = 'NonServiceTestParser';
  component = SingleTagTestComponent;

  constructor() {
  }

  public findHooks(text: string, context: {[key: string]: any}): Array<HookPosition> {
    const result: Array<HookPosition> = [];

    const matches = matchAll(text, /customhook/g);

    for (const match of matches) {
      result.push({
        openingTagStartIndex: match.index,
        openingTagEndIndex: match.index + match[0].length,
        closingTagStartIndex: null,
        closingTagEndIndex: null,
      });
    }

    return result;
  }

  public loadHook(hookId: number, hookValue: HookValue, context: {[key: string]: any}, childNodes: Array<Element>): HookData {
    return {
      component: this.component,
      injector: undefined
    };
  }

  public updateBindings(hookId: number, hookValue: HookValue, context: {[key: string]: any}): HookBindings {
    return {};
  }
}
