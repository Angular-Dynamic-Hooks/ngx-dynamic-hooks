---
---

## 8. Advanced notes
### 8.1 Programmatic usage (without component)
In some use cases, you might not actually need or want to insert the `<ngx-dynamic-hooks>`-component in your app and would rather have direct access to the parsed content to use programmatically. You can do so by injecting the `OutletService` and calling its `parse`-method directly (which the `OutletComponent` does internally as well):

```ts
parse(
    content: string,
    context: any = {},
    globalParsersBlacklist: Array<string> = null,
    globalParsersWhitelist: Array<string> = null,
    parsers: Array<HookParserEntry> = null,
    options: OutletOptions = null,
    targetElement: HTMLElement = null,
    targetHookIndex: HookIndex = null,
    injector = null
): Observable<OutletParseResult>;
```

Don't worry, this isn't as bothersome as it looks. Most of the parameters are actually just [the inputs for the OutletComponent](#62-outlet-component-bindings) and therefore optional. You really only need to pass the `content` string as you would with the component. Only the last couple of parameters are notable: You can optionally provide a `targetElement` and `targetHookIndex` to fill out for the result. If not, they are automatically created for you. You may also specify a custom injector for the created components. If you don't, it defaults to the injector of the module that imported this library.

The function will return an observable that contains an `OutletParseResult` with the form:

```ts
interface OutletParseResult {
    element: HTMLElement;               // The element containing the content with all components
    hookIndex: HookIndex;               // An object containing the generated hook data
    resolvedParsers: HookParser[];      // The parsers used for generating the result
    resolvedOptions: OutletOptions;     // The options used for generating the result
}
```
`element` is probably the most interesting part here as it contains the fully rendered content exactly as it would appear inside of the `<ngx-dynamic-hooks>`-component. `hookIndex` might also prove useful, as it is a fairly in-depth data object that holds various tidbits of info concerning the loaded components (as well as the componentRefs). 

All in all, the whole process could then look like so:

```ts
import { OutletService } from 'ngx-dynamic-hooks';

class SomeComponentOrService {
  constructor(outletService: OutletService) {
    outletService.parse('Load a component here: <app-example></app-example>').subscribe((outletParseResult: OutletParseResult) => {
        // Do whatever with it
    });
  }
```

**Caution:** When loading components this way, keep in mind that the submitted content string is only parsed once. The inputs of contained components aren't automatically updated as they would be when using the `<ngx-dynamic-hooks>`-component normally.

Also, make sure to properly destroy the created components when they are no longer needed to prevent memory leaks. You can simply use `OutletService.destroy(hookIndex: HookIndex)` for this purpose.

### 8.2 Non-browser Platforms implemention
The default implementation of `ngx-dynamic-hooks` only works in browsers ([platform-browser](https://angular.io/api/platform-browser)) since it relies on manipulating HTML DOM.

There are cases when this approach doesn't work; for example when using Angular Universal ([platform-server](https://angular.io/api/platform-server)) or Angular with [NativeScript](https://nativescript.org/).

In such cases, all you need is to implement the `PlatformService` abstract class and pass it as the second parameter to the `DynamicHooksModule.forRoot` method:

```ts
import {DynamicHooksModule, PlatformService} from 'ngx-dynamic-hooks';

class MyPlatformServerService implements PlatformService {

  /**
   * Removes an element's child nodes. 
   * Should not throw an exception when the given element doesn't exist.
   */
  clearChildNodes(element: any): void {
    //...
  }

  /**
   * Returns an element corresponding to a token- and hookId-attribute.
   * Should return null on error or when the element does not exist.
   */
  findPlaceholderElement(contentElement: any, token: string, hookId: string): any {
    //...
  }
  
  /**
   * Returns an attribute value of a given element.
   * Shoud return null on error or when the element/attribute does not exist.
   */
  getAttribute(element: any, attributeName: string): string {
    //...
  }
  
  /**
   * Returns an array of an element's child nodes.
   * Should return an empty array if there are no child nodes and null when the given node does not exist.
   */
  getChildNodes(node: any): any[] {
    //...
  }
  
  /**
   * Returns the Angular version
   * Should return 0 in case no version can be identified.
   */
  getNgVersion(): number {
    //...
  }
  
  /**
   * Returns an element's tag name.
   * Should return null on error, when a tag name cannot be found or the element does not exist.
   */
  getTagName(element: any): string {
    //...
  }
  
  /**
   * Returns the parent node of a given element.
   * Should return null when the given element does not exist.
   */
  getParentNode(element: any): any {
    //...
  }
  
  /**
   * Returns the inner text of an element.
   * Should return null when the given element doesn't exist.
   */
  getInnerText(element: any): string {
    //...
  }
  
  /**
   * Removes a child element from a given parent element.
   * Should not throw an exception when the parent or child element do not exist.
   */
  removeChild(parentElement: any, childElement: any): void {
    //...
  }
  
  /**
   * Returns the sanitized version of a given content.
   */
  sanitize(content: string): string {
    //...
  }
  
  /**
   * Sets the inner content (e.g. innerHTML in browser) of a given element.
   * Should not throw an exception when the given element does not exist.
   */
  setInnerContent(element: any, content: string): void {
    //...
  }

}

@NgModule({
  imports: [
    // ...
    DynamicHooksModule.forRoot({
      globalParsers: /* ... */
    }, MyPlatformServerService),
    // ...
  ],
  // ...
})
export class AppModule { }

```