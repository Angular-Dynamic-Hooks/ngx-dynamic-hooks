---
---

# Parsers

## Introduction

To load components from the content string, each hook needs a corresponding <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L49" target="_blank">`HookParser`</a>. These are the most important thing that you configure in the [settings]({{ "documentation/v2/configuration#global-settings" | relative_url }}) when importing the library. It expects a <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/components/outlet/options/parserEntry.ts" target="_blank">`HookParserEntry`</a>-array, which is just a fancy alias for several kinds of possible values. Each can either be:

1. A <a href="{{ "documentation/v2/parsers#selectorhookparserconfig" | relative_url }}">SelectorHookParserConfig</a> object literal.
2. A custom <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L49" target="_blank">`HookParser`</a> instance.
3. A custom <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L49" target="_blank">`HookParser`</a> class. If this class is registered as a provider in the nearest injector, it will used as a service, otherwise it will be instantiated without constructor arguments.

Option 1 is the easiest and meant to be used if you simply want to load components like in Angular templates. We have actually already used it in the [Quick Start Example]({{ "documentation/v2/quickstart" | relative_url }})!

Option 2 and 3 are only needed if you want to write your own parser. See the section [Writing your own HookParser]({{ "documentation/v2/parsers#writing-your-own-hookparser" | relative_url }}) for more info about that.

## SelectorHookParserConfig

Each <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/parsers/selector/config/selectorHookParserConfig.ts" target="_blank">`SelectorHookParserConfig`</a> is an object literal that automatically creates a `SelectorHookParser` for you, which loads components by their selectors similarly to Angular. In its simplest form, it just contains the component class like `{component: ExampleComponent}`, but it also accepts additional properties: 

These mostly determine the details about how the component selector is parsed from the content string. The only required property is `component`.

Property | Type | Default | Description
--- | --- | --- | ---
`component` | <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L126" target="_blank">`ComponentConfig`</a> | - | The component to be used. Can be its class or a [LazyLoadComponentConfig]({{ "documentation/v2/configuration#lazy-loading-components" | relative_url }}).
`name` | `string` | - | The name of the parser. Only required if you want to black- or whitelist it.
`selector` | `string` | The component selector | The selector to use for the hook. Please note that currently only tag names are supported.
`injector` | <a href="https://v17.angular.io/api/core/Injector" target="_blank">`Injector`</a> | The nearest injector | The injector to create the component with
`enclosing` | `boolean` | `true` | Whether the selector is enclosing (`<app-hook>...</app-hook>`) or not (`<app-hook>`)
`bracketStyle` | `{opening: string, closing: string}` | `{opening: '<', closing: '>'}` | The brackets to use for the selector
`parseInputs` | `boolean` | `true` | Whether to parse inputs into live variables or leave them as strings
`unescapeStrings` | `boolean` | `true` | Whether to remove escaping backslashes from inputs strings
`inputsBlacklist` | `string[]` | `null` | A list of inputs to ignore when parsing the selector
`inputsWhitelist` | `string[]` | `null` | A list of inputs to allow exclusively when parsing the selector
`outputsBlacklist` | `string[]` | `null` | A list of outputs to ignore when parsing the selector
`outputsWhitelist` | `string[]` | `null` | A list of outputs to allow exclusively when parsing the selector
`allowContextInBindings` | `boolean` | `true` | Whether to allow the use of context object variables in inputs and outputs
`allowContextFunctionCalls` | `boolean` | `true` | Whether to allow calling context object functions in inputs and outputs

## Writing your own HookParser

![Custom hook](https://i.imgur.com/9J9t5ze.png)

So far, we have only used the standard `SelectorHookParser`, which is included in this library for convenience and is easy to use if all you need is to load components by their selectors. However, by creating custom parsers, any text pattern you want can be replaced by an Angular component.

### What makes a parser

A hook parser is a class that follows the <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L49" target="_blank">`HookParser`</a> interface, which may look daunting at first, but is actually pretty simple:

```ts
interface HookParser {
    name?: string;
    findHooks(content: string, context: any): Array<HookPosition>;
    loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Array<Element>): HookComponentData;
    getBindings(hookId: number, hookValue: HookValue, context: any): HookBindings;
}
```

* The `name` property is optional and only used for black/whitelisting the parser.
* `findHooks()` is called once per parser. Its job is to find all of its hooks in the content string.
* `loadComponent()` is called once for each hook. Its job is to specify how to create the component.
* `getBindings()` is called any time the inputs and outputs for the component are to be determined. Its job is to return their names and current values.

It is recommended to create a dedicated <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L49" target="_blank">`HookParser`</a> for each custom hook (handling multiple different hooks with the same parser is messy and difficult). Here are some more details about the three main functions:

### findHooks()
Is given the content string as well as the context object as parameters and is expected to return a <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L96" target="_blank">`HookPosition`</a> array. Each <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L96" target="_blank">`HookPosition`</a> represents a found hook and specifies its position within the content string with the form:

```ts
interface HookPosition {
    openingTagStartIndex: number;
    openingTagEndIndex: number;
    closingTagStartIndex?: number;
    closingTagEndIndex?: number;
}
``` 

The opening and closing tags simply refer to the text patterns that signal the start and end of the hook and thereby also define the `<ng-content>` for the loaded component (think `[HOOK_OPENINGTAG]...content...[HOOK_CLOSINGTAG]`). If you are looking for a standalone rather than an enclosing hook (`...[HOOK]....`), you can just omit the two closing tag indexes.

How your hook looks like and how you find these indexes is completely up to you. You may look for them using Regex patterns or any other parsing method. Though, as a word of warning, do not try to parse enclosing hooks with Regex alone. <a href="https://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454" target="_blank">It is a road that leads to madness</a>.

To make your life easier, you can just use the <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/utils/hookFinder.ts" target="_blank">`HookFinder`</a> service that comes with this library (which the `SelectorHookParser` uses internally as well). Its easy-to-use and safely finds both standalone and enclosing patterns in a string. You can see it in action [in the examples below]({{ "documentation/v2/parsers#example-1-emoji-parser-standalone" | relative_url }}).

### loadComponent()
Is given the (unique) id of this hook, the <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L106" target="_blank">`HookValue`</a> (the hook as it appears in the text), the context object as well as all child nodes of the hook as parameters. It is expected to return a <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L114" target="_blank">`HookComponentData`</a> object, which tells the library how to create the component for this hook:

```ts
interface HookComponentData {
    component: ComponentConfig;
    injector?: Injector;
    content?: Node[][];
}
```

You usually only need to fill out the `component` field, which can be the component class or a <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L140" target="_blank">`LazyLoadComponentConfig`</a> (see [Lazy-loading components]({{ "documentation/v2/configuration#lazy-loading-components" | relative_url }})). You may optionally also provide your own injector and custom nodes to replace the existing `<ng-content>` of the component (each entry in the outer array represends a `<ng-content>`-slot and the inner array its content).

### getBindings()
Is given the (unique) id of this hook, the <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L106" target="_blank">`HookValue`</a> and the context object as parameters. It is expected to return a <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L148" target="_blank">`HookBindings`</a> object, which lists all the inputs to set and outputs to subscribe to in the loaded component:

```ts
interface HookBindings {
    inputs?: {[key: string]: any};
    outputs?: {[key: string]: (event: any, context: any) => any};
}
```

Both `inputs` and `outputs` must contain an object where each key is the name of the binding and each value what should be used for it. The functions you put in `outputs` will be called when the corresponding @Output() triggers and are automatically given the event object as well as the current context object as parameters. To disallow or ignore inputs/outputs, simply don't include them here.

How you determine the values for the component bindings is - again - completely up to you. You could for example have a look at the <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L106" target="_blank">`HookValue`</a> and read them from the hook itself (like property bindings in selector hooks, e.g. `[input]="'Hello!'`"). You could of course also just pass static values into the component.

{% include docs/widgets/notice.html content="
  <h4>Warning</h4>
  <p>Don't use JavaScript's <code>eval()</code> function to parse values from text into code, if you can help it. It can create massive security loopholes. If all you need is a way to safely parse strings into standard JavaScript data types like strings, numbers, arrays, object literals etc., you can simply use the <code>evaluate()</code> method from the <a href='https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/utils/dataTypeParser.ts' target='_blank'><code>DataTypeParser</code></a> service that you can also import from this library.</p>
" %}

## Example 1: Emoji parser (standalone)

Let's say we want to automatically replace all emoticons (smileys etc.) in the content string with an `EmojiComponent` that renders proper emojis for them. In this simple example, the `EmojiComponent` supports three emojis and has a `type`-string-input that that determines which one to load (can be either `laugh`, `wow` or `love`). 

What we need then, is to write a custom <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L49" target="_blank">`HookParser`</a> that finds the corresponding emoticons `:-D`, `:-O` and `:-*` in the content string, replaces them with `EmojiComponent`s and sets the correct `type` input depending on the emoticon replaced. This isn't very hard at all. Let's start with the parser:

```ts
import { Injectable } from '@angular/core';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings, HookFinder } from 'ngx-dynamic-hooks';
import { EmojiComponent } from './emoji.c';

@Injectable({ 
    providedIn: 'root' 
})
export class EmojiHookParser implements HookParser {

    constructor(private hookFinder: HookFinder) {}

    public findHooks(content: string, context: any): Array<HookPosition> {
        // As an example, this regex finds the emoticons :-D, :-O and :-*
        const emoticonRegex = /(?::-D|:-O|:-\*)/gm;

        // We can use the HookFinder service provided by the library to easily
        // find the HookPositions of any regex in the content string
        return this.hookFinder.findStandaloneHooks(content, emoticonRegex);
    }

    public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Array<Element>): HookComponentData {
        // Simply return the component class here
        return {
            component: EmojiComponent
        };
    }

    public getBindings(hookId: number, hookValue: HookValue, context: any): HookBindings {
        // Lets see what kind of emoticon this hook is and assign a fitting emoji
        let emojiType: string;
        switch (hookValue.openingTag) {
            case ':-D': emojiType = 'laugh'; break;
            case ':-O': emojiType = 'wow'; break;
            case ':-*': emojiType = 'love'; break;
        }

        // Set the 'type'-input in the EmojiComponent correspondingly
        return {
            inputs: {
                type: emojiType
            }
        };
    }
}
```

* In `findHooks()`, we create a regex for the three emoticons we want to replace and (for convenience) hand it over to the <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/utils/hookFinder.ts" target="_blank">`HookFinder`</a> service, which finds their indexes in the content string for us and returns them as a <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L96" target="_blank">`HookPosition`</a> array.
* In `loadComponent()`, we simply tell the library which component class to load for each hook/emoticon.
* In `getBindings()`, we have a look at each found hook/emoticon and infer the corresponding emoji-type for it, which we then set as the `type`-input for the `EmojiComponent`.

All that's left is to do is to add our `EmojiHookParser` to the list of active parsers as usual:

```ts
const componentParsers: Array<HookParserEntry> = [
  EmojiHookParser
];

@NgModule({
  imports: [
    BrowserModule,
    DynamicHooksModule.forRoot({
      globalParsers: componentParsers
    })
  ],
  declarations: [
    AppComponent,
    EmojiComponent
  ],
  entryComponents: [
    EmojiComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

That's it! If you now hand a content string like this to the `OutletComponent`, the emoticons will be automatically replaced by their matching `EmojiComponent`s:

Have a look at this <a href="https://stackblitz.com/edit/ngx-dynamic-hooks-customparserstandalone" target="_blank">Stackblitz</a> to see our `EmojiHookParser` in action. 

<div 
  class='stackblitz' 
  data-baseurl="https://stackblitz.com/edit/ngx-dynamic-hooks-customparserstandalone" 
  data-desktopqp="embed=1&file=src%2Fapp%2Fapp.component.ts&hideNavigation=1"
  data-mobileqp="embed=1&file=src%2Fapp%2Fapp.component.ts&hideNavigation=1&view=preview"
></div>

## Example 2: Internal link parser (enclosing)
Normally, when we include links to other parts of our app, we use the neat `[routerLink]`-directive that allows us to navigate smoothly within the single-page-app. However, this is not usually possible in dynamic content (inserted via `[innerHTML]` for example): Contained `<a>`-elements are rendered without Angular magic and clicking on them will reload the whole app, which is slow and costly.

**The solution:** Let's write a custom <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L49" target="_blank">`HookParser`</a> that looks for internal links in dynamic content and automatically replaces them with proper `[routerLink]`s, so that they behave just like any other link in the app.

This example is a bit more advanced than the `EmojiParser` from before, as we are now looking for **enclosing** (rather than **standalone**) hooks: Each link naturally consists of an opening (`<a href="internalUrl">`) and a closing (`</a>`) tag and we have to correctly find both of them. Don't worry, though, we can once again use the <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/utils/hookFinder.ts" target="_blank">`HookFinder`</a> service to do the actual searching. We just need to write two regexes for the opening and closing tag and hand them over.

Let's assume we have prepared a simple `DynamicRouterLinkComponent` that is supposed to replace the normal links in the dynamic content string. It renders a single `[routerLink]`-element based on the inputs `link` (the relative part of the url), `queryParams` and `anchorFragment`. Here then, would be our custom <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L49" target="_blank">`HookParser`</a> to load it:

```ts
import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings, HookFinder } from 'ngx-dynamic-hooks';
import { DynamicRouterLinkComponent } from './dynamicRouterLink.c';

@Injectable({
  providedIn: 'root'
})
export class DynamicRouterLinkParser implements HookParser {
    linkOpeningTagRegex;
    linkClosingTagRegex;
    hrefAttrRegex;

    constructor(@Inject(DOCUMENT) private document, private hookFinder: HookFinder) {
        // Lets assemble a regex that finds the opening <a>-tags for internal links
        const domainName = this.escapeRegExp(document.location.hostname.replace('www.', '')); // <-- This is our website name
        const internalUrl = '(?:(?:https:)?\\/\\/(?:www\\.)?' + domainName + '|(?!(?:https:)?\\/\\/))([^\\"]*?)';
        const hrefAttr = '\\s+href\=\\"' + internalUrl + '\\"';
        const anyOtherAttr = '\\s+[a-zA-Z]+\\=\\"[^\\"]*?\\"';
        const linkOpeningTag = '\\<a(?:' + anyOtherAttr + ')*?' + hrefAttr + '(?:' + anyOtherAttr + ')*?\\>';

        // Transform into proper regex objects and save for later
        this.linkOpeningTagRegex = new RegExp(linkOpeningTag, 'gim');
        this.linkClosingTagRegex = new RegExp('<\\/a>',  'gim');
        this.hrefAttrRegex = new RegExp(hrefAttr, 'im');
    }

    public findHooks(content: string, context: any): Array<HookPosition> {
        // With the regexes we prepared, we can simply use findEnclosingHooks() to retrieve
        // the HookPositions of all internal <a>-elements from the content string
        return this.hookFinder.findEnclosingHooks(content, this.linkOpeningTagRegex, this.linkClosingTagRegex);
    }

    public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Array<Element>): HookComponentData {
        // Simply return the component class here
        return {
            component: DynamicRouterLinkComponent
        };
    }

    public getBindings(hookId: number, hookValue: HookValue, context: any): HookBindings {
        // We can reuse the hrefAttrRegex here as its first capture group is the relative part of the url, 
        // e.g. '/jedi/windu' from 'https://www.mysite.com/jedi/windu', which is what we need
        const hrefAttrMatch = hookValue.openingTag.match(this.hrefAttrRegex);
        let relativeLink = hrefAttrMatch[1];

        // The relative part of the link may still contain the query string and the 
        // anchor fragment, so we need to split it up accordingly
        const anchorFragmentSplit = relativeLink.split('#');
        relativeLink = anchorFragmentSplit[0];
        const anchorFragment = anchorFragmentSplit.length > 1 ? anchorFragmentSplit[1] : null;

        const queryParamsSplit = relativeLink.split('?');
        relativeLink = queryParamsSplit[0];
        const queryParams = queryParamsSplit.length > 1 ? this.parseQueryString(queryParamsSplit[1]) : {};

        // Give all of these to our DynamicRouterLinkComponent as inputs and we're done!
        return {
            inputs: {
                link: relativeLink,
                queryParams: queryParams,
                anchorFragment: anchorFragment
            }
        };
    }

    /**
     * A helper function that safely escapes the special regex chars of any string so it
     * can be used literally in a Regex.
     * Approach by coolaj86 & Darren Cook @ https://stackoverflow.com/a/6969486/3099523
     *
     * @param string - The string to escape
     */
    private escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * A helper function that transforms a query string into a QueryParams object
     * Approach by Wolfgang Kuehn @ https://stackoverflow.com/a/8649003/3099523
     *
     * @param queryParamString - The queryString to parse
     */
    private parseQueryString(queryParamString: string): {[key: string]: any} {
        return JSON.parse('{"' + 
            decodeURI(queryParamString)
            .replace(/"/g, '\\"')
            .replace(/&/g, '","')
            .replace(/=/g, '":"') + 
        '"}');
    }
}
```

Just register the parser with the library as in other examples and that's it! All `<a>`-elements that point to internal urls will now automatically replaced by `[DynamicRouterLinkComponent]`s.

Have a look at the full, working example in this <a href="https://stackblitz.com/edit/ngx-dynamic-hooks-customparserenclosed" target="_blank">Stackblitz</a>.

<div 
  class='stackblitz' 
  data-baseurl="https://stackblitz.com/edit/ngx-dynamic-hooks-customparserenclosed" 
  data-desktopqp="embed=1&file=src%2Fapp%2Fviews%2Fhome%2Fhome.c.ts&hideNavigation=1"
  data-mobileqp="embed=1&file=src%2Fapp%2Fviews%2Fhome%2Fhome.c.ts&hideNavigation=1&view=preview"
></div>