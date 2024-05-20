---
---

## 7. Writing your own HookParser

![Custom hook](https://i.imgur.com/9J9t5ze.png)

In all of the examples above, we have used the standard `SelectorHookParser`, which comes with this library and is easy to use if all you need is to load components by their selectors. However, by creating custom parsers, any text pattern you want can be replaced by an Angular component.

### 7.1 What makes a parser:

A hook parser is a class that follows the `HookParser` interface, which may look daunting at first, but is actually pretty simple:

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
* `loadComponent()` is called once for each hook. Its job is to say how to dynamically create the component.
* `getBindings()` is called any time the inputs and outputs for the component are requested. Its job is to return their names and current values.

It is recommended to create a dedicated `HookParser` for each custom hook you are looking for (handling multiple different hooks with the same parser is messy and difficult). Here are some more details about the three main functions:

#### `findHooks()`
Is given the content string as well as the context object as parameters and is expected to return a `HookPosition` array. Each `HookPosition` represents a found hook and lists its indexes within the content string with the form:

```ts
interface HookPosition {
    openingTagStartIndex: number;
    openingTagEndIndex: number;
    closingTagStartIndex?: number;
    closingTagEndIndex?: number;
}
``` 

The opening and closing tags simply refer to the text patterns that signal the start and end of the hook and thereby also define the `<ng-content>` for the loaded component (think `[HOOK_OPENINGTAG]...content...[HOOK_CLOSINGTAG]`). If you are looking for a standalone rather than an enclosing hook (`...[HOOK]....`), you can just omit the two closing tag indexes.

How your hook looks like and how you find these indexes is completely up to you. You may look for them using Regex patterns or any other parsing method. Though, as a word of warning, do not try to parse enclosing hooks with Regex alone. [It is a road that leads to madness](https://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454).

To make your life easier, you can just use the `HookFinder` service that comes with this library (which the `SelectorHookParser` uses internally as well). Its easy-to-use and safely finds both standalone and enclosing patterns in a string. You can see it in action [in the examples below](#72-example-emoji-parser-standalone).

#### `loadComponent()`
Is given the (unique) id of this hook, the `HookValue` (the hook as it appears in the text), the context object as well as all child nodes of the hook as parameters. It is expected to return a `HookComponentData` object, which tells the library how to create the component for this hook:

```ts
interface HookComponentData {
    component: ComponentConfig;
    injector?: Injector;
    content?: Node[][];
}
```

You usually only need to fill out the `component` field, which can be the component class or a `LazyLoadComponentConfig` (see [Lazy-loading components](#65-lazy-loading-components)). You may optionally also provide your own injector and custom nodes to replace the existing `<ng-content>` of the component (each entry in the outer array represends a `<ng-content>`-slot and the inner array its content).

#### `getBindings()`
Is given the (unique) id of this hook, the `HookValue` (the hook as it appears in the text) and the context object as parameters. It is expected to return a `HookBindings` object, which lists all the inputs to set and outputs to subscribe to in the loaded component:

```ts
interface HookBindings {
    inputs?: {[key: string]: any};
    outputs?: {[key: string]: (event: any, context: any) => any};
}
```

Both `inputs` and `outputs` must contain an object where each key is the name of the binding and each value what should be used for it. The functions you deposit in `outputs` as values will be called when the corresponding @Output() triggers and are automatically given the event object as well as the current context object as parameters. To disallow or ignore inputs/outputs, simply don't include them here.

How you determine the values for the component bindings is - again - completely up to you. You could for example have a look at the `HookValue` and read them from the hook itself (like property bindings in selector hooks, e.g. `[input]="'Hello!'`"). You could of course also just pass static values into the component here - regardless of the hook's appearance.

**Warning:** Don't use JavaScript's `eval()` function to evaluate bindings from text into live code, if you can help it. It can create massive security loopholes. If all you need is a way to safely parse strings into standard JavaScript data types like strings, numbers, arrays, object literals etc., you can simply use the `evaluate()` method from the `DataTypeParser` service that you can also import from this library (which, again, the `SelectorHookParser` uses internally as well).

### 7.2 Example: Emoji parser (standalone)
Let's say we want to automatically replace all emoticons (smileys etc.) in the content string with an `EmojiComponent` that renders proper emojis for them. In this simple example, the `EmojiComponent` supports three emojis and has a `type`-string-input that that determines which one to load (can be either `laugh`, `wow` or `love`). 

What we need then, is to write a custom `HookParser` that finds the corresponding emoticons `:-D`, `:-O` and `:-*` in the content string, replaces them with `EmojiComponent`s and sets the correct `type` input depending on the emoticon replaced. This isn't very hard at all. Let's start with the parser:

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

        // We can use the HookFinder service from ngx-dynamic-hooks library to easily
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

* In `findHooks()`, we create a regex for the three emoticons we want to replace and (out of convenience) hand it over to the injected `HookFinder` service, which finds their indexes in the content string for us and returns them as a `HookPosition` array.
* In `loadComponent()`, we simply tell the library which component class to load for each hook/emoticon.
* In `getBindings()`, we have a look at each found hook/emoticon and infer the corresponding emoji-type for it, which we then set as the `type`-input for the `EmojiComponent`.

All that's left is to do is to add our `EmojiHookParser` to the list of active parsers, either on the `OutletComponent` itself or as a global parser in `forRoot()` like here:

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

```html
<ngx-dynamic-hooks [content]="'What a big lightsaber :-O! Let's meet up later :-*.'"></ngx-dynamic-hooks>
```

Have a look at this [Stackblitz](https://stackblitz.com/edit/ngx-dynamic-hooks-customparserstandalone) to see our `EmojiHookParser` in action. 

### 7.3 Example: Internal link parser (enclosing)
Normally, when we include links to other pages on our app, we use the neat `[routerLink]`-directive that allows us to navigate smoothly within the single-page-app. However, this is not usually possible in dynamic content (inserted via `[innerHTML]` for example): Contained `<a>`-elements are rendered without Angular routing functionality and will request the whole app to reload from the server under a different url, which is slow and costs needless bandwidth.

**The solution:** Let's write a custom `HookParser` that looks for internal links in dynamic content and automatically replaces them with proper `[RouterLink]`s, so that they behave just like any other link in the app.

This example is a bit more advanced than the `EmojiParser` from before, as we are now looking for **enclosing** (rather than **standalone**) hooks: Each link naturally consists of an opening (`<a href="internalUrl">`) and a closing (`</a>`) tag and we have to correctly find both of them. Don't worry, though, we can once again use the `HookFinder` service to do the actual searching. We just need to write two regexes for the opening and closing tag and hand them over.

Let's assume we have prepared a simple `DynamicRouterLinkComponent` that is supposed to replace the normal links in the dynamic content string. It renders a single `[routerLink]`-element based on the inputs `link` (the relative part of the url), `queryParams` and `anchorFragment`. Here then, would be our custom `HookParser` to load it:

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

Have a look at the full, working example in this [Stackblitz](https://stackblitz.com/edit/ngx-dynamic-hooks-customparserenclosed).