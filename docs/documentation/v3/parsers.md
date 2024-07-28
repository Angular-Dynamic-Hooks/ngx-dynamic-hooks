---
---

# Parsers

## Introduction

Components are loaded from [hooks]({{ "documentation/v3/#whats-a-hook" | relative_url }}) in the content, but how does the library know how a hook looks like and which component to load for it? This job is accomplished by **HookParsers**. These are what you pass along as the `parsers` input/argument to the library. Each component has one and it can be either:

1. The component class itself.
2. A <a href="{{ "documentation/v3/parsers#selectorhookparserconfig" | relative_url }}">SelectorHookParserConfig</a> object literal.
3. A custom `HookParser` instance.
4. A custom `HookParser` class. If this class is available as a provider/service, it will be injected.

Using the component class is the most straightforward option. It internally sets up a `SelectorHookParser` for you which loads components just like in Angular templates. We have been using it in most simple examples, such as in [Quick Start]({{ "documentation/v3/quickstart" | relative_url }}) and most of the [General usage page]({{ "documentation/v3/general-usage" | relative_url }}).

If you want more control, you can also manually configure a `SelectorHookParser` by passing in a [SelectorHookParserConfig]({{ "documentation/v3/parsers#selectorhookparserconfig" | relative_url }}), which provides additional options.

For even more specific use-cases, you may want to write your own HookParser. See the section [Writing your own HookParser]({{ "documentation/v3/parsers#writing-your-own-hookparser" | relative_url }}) for more info about that.

## SelectorHookParserConfig

A `SelectorHookParserConfig` is an object literal that can be used in the `parsers` field to create customized `SelectorHookParser` for you (which loads components by their selectors similarly to Angular).

In its simplest form, it just contains the component class like `{component: ExampleComponent}`, but it also accepts additional properties: 

Property | Type | Default | Description
--- | --- | --- | ---
`component` | `ComponentConfig` | - | The component to be used. Can be its class or a [LazyLoadComponentConfig]({{ "documentation/v3/configuration#lazy-loading-components" | relative_url }}).
`name` | `string` | - | The name of the parser. Only required if you want to black- or whitelist it.
`selector` | `string` | The component selector | The selector to use to find the hook.
`hostElementTag` | `string` | - | A custom tag to be used for the component host element.
`injector` | <a href="https://angular.dev/api/core/Injector" target="_blank">`Injector`</a> | The nearest one | The Injector to create the component with.
`environmentInjector` | <a href="https://angular.dev/api/core/EnvironmentInjector" target="_blank">`EnvironmentInjector`</a> | The nearest one | The EnvironmentInjector to create the component with.
`enclosing` | `boolean` | `true` | Whether the selector is enclosing (`<hook>...</hook>`) or not (`<hook>`).
`bracketStyle` | `{opening: string, closing: string}` | `{opening: '<', closing: '>'}` | The brackets to use for the selector.
`parseInputs` | `boolean` | `true` | Whether to parse inputs into data types or leave them as strings.
`unescapeStrings` | `boolean` | `true` | Whether to remove escaping backslashes from inputs.
`inputsBlacklist` | `string[]` | `null` | A list of inputs to ignore.
`inputsWhitelist` | `string[]` | `null` | A list of inputs to allow exclusively.
`outputsBlacklist` | `string[]` | `null` | A list of outputs to ignore.
`outputsWhitelist` | `string[]` | `null` | A list of outputs to allow exclusively.
`allowContextInBindings` | `boolean` | `true` | Whether to allow the use of context object variables in inputs and outputs.
`allowContextFunctionCalls` | `boolean` | `true` | Whether to allow calling context object functions in inputs and outputs.

See the [General Usage]({{ "documentation/v3/general-usage#load-by-any-selector" | relative_url }}) page for a simple `SelectorHookParserConfig` example.

{% include docs/widgets/notice.html content="
  <p>Please note that you cannot use full CSS selectors in the <code>selector</code> field if you set <code>enclosing</code> to <code>false</code> or use a custom <code>bracketStyle</code> as you aren't looking for valid HTML elements at that point. The selector can then only be the direct tag name, e.g. <code>app-example</code>.</p>
" %}

## Writing your own HookParser

![Custom hook](https://i.imgur.com/9J9t5ze.png)

So far, we have only used the standard `SelectorHookParser`, which is included in this library for convenience and is easy to use if all you need is to load components by their selectors. However, by creating custom parsers, any element or text pattern you want can be replaced by an Angular component.

Custom parsers can look for either **element hooks** or **text hooks**. Element hooks are straightforward and load components into found html elements while text hooks can replace any arbitrary text pattern with components.

### What makes a parser

A hook parser is any class that follows the `HookParser` interface, which requires the following:

* An optional `name` property that is used for black/whitelisting the parser.
* `findHooks()` or `findHookElements()` tell the library what text/elements to replace with components.
* `loadComponent()` specifies which component class to load.
* `getBindings()` returns the component inputs/outputs.

You only need to implement either `findHooks()` or `findHookElements()`, depending on whether you want to replace text or HTML elements with components.

It is recommended to create a dedicated `HookParser` for each custom hook/component (handling multiple different hooks with the same parser is messy and difficult). Here are some more details about the main functions:

### findHooks()

{% include docs/widgets/notice.html content="
  <span>Only needed if you want to find text hooks. For element hooks, see <code>findHookElements()</code>.</span>
" %}

```ts
  findHooks(content: string, context: any, options: ParseOptions): HookPosition[]
```

Is given a string of content and is expected to return a `HookPosition` array from it. Each `HookPosition` represents a found text hook and specifies its position within the content string:

```ts
interface HookPosition {
    openingTagStartIndex: number;
    openingTagEndIndex: number;
    closingTagStartIndex?: number;
    closingTagEndIndex?: number;
}
``` 

The opening and closing tags simply refer to the text patterns that signal the start and end of the hook and thereby also define the `<ng-content>` (think `[HOOK_OPENINGTAG]...content...[HOOK_CLOSINGTAG]`). If you are looking for a singletag rather than an enclosing hook (`...[HOOK]....`), you can just omit the two closing tag indexes.

How your hook looks like and how you find these indexes is completely up to you. You may look for them using Regex patterns or any other parsing method. Though, as a word of warning, do not try to parse enclosing hooks with Regex alone. <a href="https://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454" target="_blank">That road leads to madness</a>.

To make your life easier, you can just use the `HookFinder` service that comes with this library. Its easy to use and safely finds both singletag and enclosing patterns in a string. You can see it in action in the ["Emoji parser" example]({{ "documentation/v3/parsers#example-2-emoji-parser" | relative_url }}).

### findHookElements()

{% include docs/widgets/notice.html content="
  <span>Only needed if you want to find element hooks. For text hooks, see <code>findHooks()</code>.</span>
" %}

```ts
  findHookElements(contentElement: any, context: any, options: ParseOptions): any[]
```

Is given the main content element and is expected to return an array of child elements that should be used as element hooks.

Finding element hooks is rather easy as you can interact directly with the actual content element. You can typically just do something like this:

```ts
return Array.from(contentElement.querySelectorAll('.myHook'));
```

### loadComponent()

```ts
  loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: any[], options: ParseOptions): HookComponentData
```

Is given the found hook string or element as `HookValue` and is expected to return a `HookComponentData` object, which tells the library how to create the component for this hook:

```ts
interface HookComponentData {
    component: ComponentConfig;
    hostElementTag?: string;
    injector?: Injector;
    environmentInjector?: EnvironmentInjector;
    content?: any[][];
}
```

You usually only need to fill out the `component` field, which can be the component class or a `LazyLoadComponentConfig` (see [Lazy-loading components]({{ "documentation/v3/configuration#lazy-loading-components" | relative_url }})). 

You may optionally also specify a custom host element tag, provide your own injectors or use custom content to replace the existing `<ng-content>` (each entry in the outer array represends a `<ng-content>`-slot and the inner array its content).

### getBindings()

```ts
  getBindings(hookId: number, hookValue: HookValue, context: any, options: ParseOptions): HookBindings;
```

Is given the `HookValue` and is expected to return a `HookBindings` object, which contains all the current inputs and outputs for the component:

```ts
interface HookBindings {
    inputs?: {[key: string]: any};
    outputs?: {[key: string]: (event: any, context: any) => any};
}
```

Both `inputs` and `outputs` must contain an object where each key is the name of the binding and each value what should be used for it. The functions you put in `outputs` will be called when the corresponding @Output() triggers and are automatically given the event object as well as the current context object as parameters. To disallow or ignore inputs/outputs, simply don't include them here.

How you determine the values for the component bindings is - again - completely up to you. You could for example have a look at the `HookValue` and read them from the hook itself (like property bindings in selector hooks, e.g. `[input]="'Hello!'`"). You could of course also just pass static values into the component.

{% include docs/widgets/notice.html content="
  <h4>Warning</h4>
  <p>Don't use JavaScript's <code>eval()</code> function to parse values from text into code, if you can help it. It can create massive security loopholes. If all you need is a way to safely parse strings into standard JavaScript data types like strings, numbers, arrays, object literals etc., you can simply use the <code>evaluate()</code> method from the <code>DataTypeParser</code> service that you can also import from this library.</p>
" %}

## Example 1: Minimal

Let's write a a minimal custom `HookParser` for our trusty `ExampleComponent`:

```ts
import { Injectable } from '@angular/core';
import { HookParser, HookValue, HookComponentData, HookBindings } from 'ngx-dynamic-hooks';
import { ExampleComponent } from 'somewhere';

@Injectable({ 
  providedIn: 'root' 
})
export class ExampleParser implements HookParser {

  findHookElements(contentElement: any, context: any, options: ParseOptions): any[] {
    // Return all <app-example> elements
    return Array.from(contentElement.querySelectorAll('app-example'));
  }

  loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: any[], options: ParseOptions): HookComponentData {
    // Return the component class
    return { component: ExampleComponent };
  }

  getBindings(hookId: number, hookValue: HookValue, context: any, options: ParseOptions): HookBindings {
    // Return inputs/outputs to set
    return {
      inputs: {
        message: 'Hello there!'
      }
    }
  }
}
```

Now just pass the parser in the `parsers`-field and it will work!

```ts
...
export class AppComponent {
  content = 'Load a component here: <app-example></app-example>';
  parsers = [ExampleParser];
}
```

```html
<ngx-dynamic-hooks [content]="content" [parsers]="parsers"></ngx-dynamic-hooks>
```

See it in action in this Stackblitz:

{% include docs/widgets/notice.html content='
  <span>Live example to be followed!</span>
' %}

## Example 2: Emoji parser

Let's say we want to replace replace text emoticons (smileys etc.) with an `EmojiComponent` that renders animated emojis for them.

This means that we need to **replace text** instead of HTML elements with components this time and therefore must use `findHooks()` instead of `findHookElements()`.

For the purpose of this example, we have a simple `EmojiComponent` that supports three emojis. It has a `type`-input that determines which one to load (can be either `laugh`, `wow` or `love`). The parser could then look like so:

```ts
...
export class EmojiParser implements HookParser {

  constructor(private hookFinder: HookFinder) {}

  findHooks(content: string, context: any, options: ParseOptions): HookPosition[] {
    // As an example, this regex finds the emoticons :-D, :-O and :-*
    const emoticonRegex = /(?::-D|:-O|:-\*)/gm;

    // We can use the HookFinder service provided by the library to easily
    // find the HookPositions of any regex in the content string
    return this.hookFinder.findHooks(content, emoticonRegex);
  }

  loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Element[], options: ParseOptions): HookComponentData {
    return { component: EmojiComponent };
  }

  getBindings(hookId: number, hookValue: HookValue, context: any, options: ParseOptions): HookBindings {
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
        type: emojiType!
      }
    };
  }
}
```

See it in action in this Stackblitz:

{% include docs/widgets/notice.html content='
  <span>Live example to be followed!</span>
' %}

## Example 3: Image parser

A really neat use-case for custom parsers is to take standard HTML elements and replace them with more useful Angular components.

For example, we could automatically add lightboxes to all images of an article marked with a `lightbox` class, so users can click on them to see a larger version. Assuming we have html like:

```html
<img class="lightbox" src="image.jpeg" src-large="image-large.jpeg">
```

A parser that replaces those `<img>` elements with `ClickableImgComponent`s could then look as follows:

```ts
...
export class ClickableImgParser implements HookParser {

  findHookElements(contentElement: any, context: any, options: ParseOptions): any[] {
    // Find all img-elements with the lightbox class
    return Array.from(contentElement.querySelectorAll('img.lightbox'));
  }

  loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: any[], options: ParseOptions): HookComponentData {
    return {
      component: ClickableImgComponent,   // Load our component
      hostElementTag: 'lightbox-img'      // As img-elements can't have content, replace them with '<lightbox-img>' elements
    };
  }

  getBindings(hookId: number, hookValue: HookValue, context: any, options: ParseOptions): HookBindings {
    // Read the image urls from the element attributes and pass along as inputs
    const imgElement: HTMLImageElement = hookValue.elementSnapshot;
    return {
      inputs: {
        src: imgElement.getAttribute('src'),
        srcLarge: imgElement.getAttribute('src-large')
      }
    }
  }
}
```

Our `ClickableImgComponent` will then use `src` to render the image in the article itself and use `srcLarge` (if it exists) for the lightbox version.

See it in action in this Stackblitz:

{% include docs/widgets/notice.html content='
  <span>Live example to be followed!</span>
' %}

## Example 4: Link parser

Another cool idea for a custom parser is to enhance standard HTML links so that clicking on them uses the actual Angular router instead of reloading the whole browser tab, which is slow and costly.

We can simply write a custom `HookParser` that looks for internal links in the content and automatically replaces them with a component that uses proper `[routerLink]`s.

Let's assume we have prepared a `DynamicLinkComponent` that renders a single Angular link based on the inputs `path`, `queryParams` and `fragment`. Here then, would be our custom `HookParser` for it:

```ts
import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HookParser, HookValue, HookComponentData, HookBindings } from 'ngx-dynamic-hooks';
import { DynamicLinkComponent } from 'somewhere';

@Injectable({
  providedIn: 'root'
})
export class DynamicLinkParser implements HookParser {
  base;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.base = `${this.document.location.protocol}//${this.document.location.hostname}`;
  }

  public findHookElements(contentElement: HTMLElement, context: any, options: ParseOptions): any[] {
    // First get all link elements
    return Array.from(contentElement.querySelectorAll('a[href]'))
    // Then filter them so that only those with own hostname remain
    .filter(linkElement => {
        const url = new URL(linkElement.getAttribute('href')!, this.base);
        return url.hostname === this.document.location.hostname;
      }
    );
  }

  public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Element[], options: ParseOptions): HookComponentData {
    return { component: DynamicLinkComponent };
  }

  public getBindings(hookId: number, hookValue: HookValue, context: any, options: ParseOptions): HookBindings {
    const url = new URL(hookValue.elementSnapshot.getAttribute('href')!, this.base);

    // Extract what we need from the URL object and pass it along to DynamicLinkComponent
    return {
      inputs: {
        path: url.pathname,
        queryParams: Object.fromEntries(url.searchParams.entries()),
        fragment: url.hash.replace('#', '')
      }
    };
  }
}
```

See it in action in this Stackblitz:

{% include docs/widgets/notice.html content='
  <span>Live example to be followed!</span>
' %}