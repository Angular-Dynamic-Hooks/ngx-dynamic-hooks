---
---

# Advanced notes

## Programmatic usage (without component)

You can bypass the `<ngx-dynamic-hooks>`-component and parse the dynamic content directly in Typescript by injecting the <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/components/outlet/services/outletService.ts" target="_blank">`OutletService`</a> and calling its `parse`-method programmatically (which the `<ngx-dynamic-hooks>` component internally does as well):

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

Don't worry, most of the parameters are just [the inputs]({{ "documentation/v2/configuration#component-bindings" | relative_url }}) for the `<ngx-dynamic-hooks>` component and therefore optional. You really only need to pass the `content` string as you would with the component. 

Only the last couple of parameters are notable: You can optionally provide a `targetElement` and `targetHookIndex` to fill out for the result. If not, they are automatically created for you. You may also specify a custom injector for the created components. If you don't, it defaults to module injector.

The function will return an observable that contains an <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L207" target="_blank">`OutletParseResult`</a> with the form:

```ts
interface OutletParseResult {
    element: HTMLElement;               // The element containing the content with all components
    hookIndex: HookIndex;               // An object containing the generated hook data
    resolvedParsers: HookParser[];      // The parsers used for generating the result
    resolvedOptions: OutletOptions;     // The options used for generating the result
}
```
`element` is probably the most interesting part here as it contains the fully rendered content exactly as it would appear inside of the `<ngx-dynamic-hooks>`-component. `hookIndex` might also prove useful, as it is a fairly in-depth data object that holds various tidbits of info concerning the loaded components (as well as the componentRefs). 

Calling this function could then look like so:

```ts
import { OutletService } from 'ngx-dynamic-hooks';

class SomeComponentOrService {
  constructor(outletService: OutletService) {
    const content = 'Load a component here: <app-example></app-example>';
    outletService.parse(content).subscribe(outletParseResult => {
        // Do whatever with it
    });
  }
```

{% include docs/widgets/notice.html content="
  <h4>About component lifecycles</h4>
  <p>When loading components this way, keep in mind that the submitted content string is only parsed once. The inputs of contained components aren't automatically updated as they would be when using the component normally.</p>
  <p>Also, make sure to properly destroy the created components when they are no longer needed to prevent memory leaks. You can simply use <a href='https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/components/outlet/services/outletService.ts#L119' target='_blank'><code>OutletService.destroy(hookIndex: HookIndex)</code></a> for this purpose.</p>
" %}

## Alternative platforms

The default implementation of the library should work in both <a href="https://v17.angular.io/api/platform-browser" target="_blank">browsers</a> as well as during <a href="https://v17.angular.io/guide/ssr" target="_blank">server-side-rendering</a>. However, there may be more specialized use cases on platforms that are not directly supported.

In such cases, all you need is to implement the <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/platform/platformService.ts" target="_blank">`PlatformService`</a> abstract class and pass it as the second parameter to the `DynamicHooksModule.forRoot` method:

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