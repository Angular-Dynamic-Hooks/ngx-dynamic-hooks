# ngx-dynamic-hooks

[![Travis CI](https://img.shields.io/travis/com/MTobisch/ngx-dynamic-hooks?style=flat-square)](https://travis-ci.com/github/MTobisch/ngx-dynamic-hooks)
[![Coverage](https://img.shields.io/codecov/c/gh/MTobisch/ngx-dynamic-hooks?style=flat-square)](https://codecov.io/gh/MTobisch/ngx-dynamic-hooks)
[![NPM](https://img.shields.io/npm/v/ngx-dynamic-hooks?color=orange&style=flat-square)](https://www.npmjs.com/package/ngx-dynamic-hooks)
[![License](https://img.shields.io/github/license/mtobisch/ngx-dynamic-hooks?color=blue&style=flat-square)](https://github.com/MTobisch/ngx-dynamic-hooks/blob/master/LICENSE.md)

Automatically insert live Angular components into dynamic strings (based on their selector or **any pattern of your choice**) and render the result in the DOM.

## Table of contents
1. [Installation](#1-installation)
2. [Compatibility](#2-compatibility)
3. [What it does](#3-what-it-does)
4. [Quick start](#4-quick-start)
5. [Features](#5-features)
    * [5.1 Context & Dependency Injection](#51-context--dependency-injection)
    * [5.2 Inputs ](#52-inputs)
    * [5.3 Outputs](#53-outputs)
    * [5.4 Content projection](#54-content-projection)
    * [5.5 Lifecycle methods](#55-lifecycle-methods)
    * [5.6 Change detection](#56-change-detection)
6. [Configuration](#6-configuration)
    * [6.1 Global settings](#61-global-settings)
    * [6.2 Outlet component bindings](#62-outlet-component-bindings)
    * [6.3 `HookParserEntry`](#63-hookparserentry)
    * [6.4 `OutletOptions`](#64-outletoptions)
    * [6.5 Lazy-loading components](#65-lazy-loading-components)
7. [Writing your own HookParser](#7-writing-your-own-hookparser)
    * [7.1 What makes a parser](#71-what-makes-a-parser)
    * [7.2 Example: Emoji parser (standalone)](#72-example-emoji-parser-standalone)
    * [7.3 Example: Internal link parser (enclosing)](#73-example-internal-link-parser-enclosing)
8. [Trivia](#8-trivia)
    * [8.1 How it works](#81-how-it-works)
    * [8.2 Security](#82-security)
    * [8.3 Caveats](#83-caveats)
    * [8.4 Comparison with similar libraries](#84-comparison-with-similar-libraries)
9. [Troubleshooting](#9-troubleshooting)
10. [Special thanks](#10-special-thanks)

## 1. Installation
Simply install via npm 

```sh
npm install ngx-dynamic-hooks --save
```

or yarn

```sh
yarn add ngx-dynamic-hooks
```

## 2. Compatibility
| Angular | Library | JiT | AoT | Ivy | NPM |
| --- | --- | --- | --- | --- | --- |
| 6 - 10  | 1.x.x | yes | yes | yes | `ngx-dynamic-hooks@^1.0.0` |

The library is compatible with both the older template engine (view engine) as well as Ivy. As it does not rely on a runtime compiler, it also works in both JiT- and AoT-environments.

## 3. What it does
In Angular, components are loaded when their selector appears in a template. But what if you wanted to load components not just in fixed templates, but in dynamic content as well - such as in text from a database, markdown files or even just string variables?

The `[innerHTML]`-directive provided by Angular, which is typically used to render dynamic HTML content, might be the first solution to come to mind. However, not least due to security concerns, it isn't parsed for Angular template syntax, so it won't load Angular components.

The Dynamic Hooks library provides you with an outlet-component that acts as an enhanced version of `[innerHTML]` of sorts, allowing you to dynamically load components into a string of content in a controlled and secure manner by using so-called **hooks**.

![How hooks work](https://i.imgur.com/BRnmD2d.png)

### What is a hook? 

Simply put, hooks are any piece of text in the dynamic content to be replaced by an Angular component. Hooks can be **standalone** (`<hook>`) or **enclosing** (`<hook>...</hook>`). To find them, each hook has a corresponding **HookParser** that looks for it and tells the library how to instantiate the component.

In many cases, you might simply want to use the existing component selectors as their hooks. This is why this library comes with an out-of-the-box `SelectorHookParser` that is easy to set up. With it, you can write your selectors just like you would in a normal template (`<app-somecomponent [someInput]="'hello!'">...</app-somecomponent>`) and the corresponding components will be loaded in their place.

![Selector hook](https://i.imgur.com/tjAX6uU.png)

Keep in mind, though, that hooks can be anything - not just component selectors! If you want, you can create custom hook parsers that look for any text pattern of your choice to be replaced by an Angular component! (For examples, [see below](#7-writing-your-own-hookparser))

The dynamically-loaded components are fully-functional and created with native Angular methods. They seamlessly integrate into the rest of the app: @Inputs(), @Outputs(), content projection / transcluded content, change detection, dependency injection and lifecycle methods all work normally. If you are using the Ivy templating engine, you can even lazy-load components right when they are needed. For more details about all of these topics, see the following sections.

>**Note:** This library does not parse the content string as an actual Angular template. It merely looks for all registered hooks and replaces them with their corresponding Angular components. This means that special Angular template syntax will **not** work. On the flipside, this grants a great deal more flexbility and security than just parsing a template, such as allowing components to be loaded by any text pattern, support for both JiT- and AoT-modes, granular control over which components are allowed, sanitization etc.

## 4. Quick start
Import `DynamicHooksModule` into your main app module and configure via `forRoot()`:

```ts
import { DynamicHooksModule, HookParserEntry } from 'ngx-dynamic-hooks';
import { ExampleComponent } from 'somewhere';

// This automatically creates SelectorHookParsers for each listed component:
const componentParsers: Array<HookParserEntry> = [
    {component: ExampleComponent},
    // ...
];

@NgModule({
  imports: [
    // forRoot() is used to register global parsers and options
    DynamicHooksModule.forRoot({
      globalParsers: componentParsers
    }),
    // ...
  ],
  // Without Ivy: Make sure all dynamic components are listed in declarations and entryComponents.
  // Otherwise, the compiler will not include them if they aren't otherwise used in a template.
  declarations: [ ExampleComponent, /* ... */ ],
  entryComponents: [ ExampleComponent, /* ... */ ],
  // ...
})
export class AppModule { }
```
Then use the `OutletComponent` (`<ngx-dynamic-hooks>`) where you want to render the content string and pass it in via the `[content]`-input:

```html
<ngx-dynamic-hooks [content]="'Load a component here: <app-example></app-example>'"></ngx-dynamic-hooks>
```

That's it! If `<app-example>` is the selector of `ExampleComponent`, it will automatically be loaded in its place, just like in a normal template.

**See it in action** in this [Stackblitz](https://stackblitz.com/edit/ngx-dynamic-hooks-quickstart). 

This is a very minimalist example. Check out the [Configuration](#6-configuration) and [Writing your own HookParser](#7-writing-your-own-hookparser) sections to find out how to tailor everything to your exact needs.

## 5. Features

### 5.1 Context & Dependency Injection:
Often, you may want to communicate with the dynamically-loaded components or pass data to them from the rest of the app. To do so, you have two options:

1. **The context object**
2. **Dependency injection**

The latter works just like in any other component. Simply [inject your services into the component constructor](https://angular.io/guide/dependency-injection) and you're good to go. However, this approach may seem like overkill at times, when you just want to pass in a variable from the parent component into the dynamically-loaded component, perhaps as an input. This is where the context object comes into play.

The context object acts as a bridge between the parent component holding the `OutletComponent` and all dynamically loaded components within. Imagine a context object like:

```ts
const contextObj = {name: 'Kenobi'};
```

You can provide it to the `OutletComponent` as an optional input:

```html
<ngx-dynamic-hooks [content]="..." [context]="contextObj"></ngx-dynamic-hooks>
```

And then use the `context`-keyword to use its data in selector hooks:

```html
'...some dynamic content... <app-jedi [name]="context.name"></app-jedi> ...more dynamic content...'
```

The context object is typically a simple object literal that provides some values of interest from the parent component, but it can technically be anything - even the parent component itself. You can also use alternative notations to access its properties like `context['name']`, call functions like `context.someFunc()` and even use nested expressions like `context[context.someProp].someFunc(context.someParam)`.

**Note:** The context object is the only piece of live code that can accessed from within the content string. No variables or functions, global or otherwise, can be used besides it. This is an intentional security measure. Simply put whatever you want to make available to the author of the text into the context object.

![Communication flow](https://i.imgur.com/K63SQGU.jpg)

### 5.2 Inputs:
You can pass data of almost any type to @Inputs() in selector hooks, such as:

| Type | Example |
| --- | --- | 
| strings  | `[inputName]="'Hello!'"` |
| numbers | `[inputName]="123"` |
| booleans | `[inputName]="true"` |
| null/undefined | `[inputName]="null"` |
| arrays | `[inputName]="['an', 'array', 'of', 'strings']"` |
| object literals | `[inputName]="{planet: 'Tatooine', population: 200000}"` |
| context variables (see [previous point](#51-context--dependency-injection)) | `[inputName]="context.someProp"` |

The inputs are automatically set in the dynamic component and will trigger `ngOnChanges()`/`ngOnInit()` normally.

If using []-brackets, the inputs will be safely parsed into their corresponding variable data type. Because of this, take care to write them code-like, as if this was a TS/JS-file (e.g. don't forget put quotes around strings **in addition** to the quotes of the input property binding).

Alternatively, you may also write inputs without []-brackets as normal HTML-attributes, in which case they won't be parsed at all and will simply be considered strings.

### 5.3 Outputs:
You can subscribe to @Output() events from selector hooks with functions from the context object like:

```html
'...some dynamic content... <app-jedi (wasDefeated)="context.goIntoExile($event)"></app-jedi> ...more dynamic content...'
```
As with normal Angular @Output() bindings, the special `$event`-keyword can optionally be used to pass the emitted event object as a parameter to the function.

#### A note about `this`:
A function directly assigned to the context object will have `this` pointing to the context object itself when called, as per standard JavaScript behavior. This may be undesired when you would rather have `this` point to original parent object of the function. Two ways to achieve that: 

* Assign the parent of the function to the context object (instead of the function itself) and call via `context.parent.func()`
* If you don't want to expose the parent, assign a [bound function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) to the context object like `const contextObj = {func: this.func.bind(this)}`.

### 5.4 Content projection:
Hooks can be nested without limitations. The loaded components will correctly be rendered in each others `<ng-content>`-slots. When using selector hooks, it will look and work identical as in normal Angular templates:
```html
'...some dynamic content... 
<app-parent>
    <app-content-child></app-content-child>
</app-parent>
...more dynamic content...'
```

There are two small caveats, however: 
1. Parent components cannot use `@ContentChildren()` to get a list of all of the nested components in the content string, as these have to be known at compile time. However, you can still access them via `onDynamicMount()` (see [Lifecycle methods](#55-lifecycle-methods)). 
2. Multiple named `<ng-content>` outlets are currently not supported in component selector hooks. 

### 5.5 Lifecycle methods:
All of Angular's lifecycle methods work normally in dynamically-loaded components. In addition, this library introduces two new lifecycle methods that you can optionally implement: 

* `onDynamicMount()` is called once as soon as **all** dynamic components have rendered (including [lazy-loaded ones](#65-lazy-loading-components)). It is given an `OnDynamicData`-object as its parameter, containing the context object as well as the content children of the component.
* `onDynamicChanges()` is called any time one of these two change. It is also given an `OnDynamicData`-object that will only contain the changed value. The method is therefore called:
    1. Immediately when the component is created (`OnDynamicData` will contain the context object, if not undefined)
    2. Once all components have loaded (`OnDynamicData` will contain the content children)
    3. Any time that context changes by reference (`OnDynamicData` will contain the new context object)

You can implement them like so:
```ts
import { OnDynamicMount, OnDynamicChanges, OnDynamicData, DynamicContentChild } from 'ngx-dynamic-hooks';

export class DynamicComponent implements OnDynamicMount, OnDynamicChanges {

  onDynamicMount(data: OnDynamicData): void {
    // Contains the context object and the content children
    const context = data.context;
    const contentChildren: DynamicContentChild[] = data.contentChildren;
  }

  onDynamicChanges(data: OnDynamicData): void {
    // Contains whichever changed
    if (data.hasOwnProperty('context')) {
      const context = data.context;
    }
    if (data.hasOwnProperty('contentChildren')) {
      const contentChildren: DynamicContentChild[] = data.contentChildren;
    }
  }
}
```

**Note:** You may have spotted that content children are given as `DynamicContentChild`-arrays. Each `DynamicContentChild` consists of the `ComponentRef`, the selector and the `HookValue` of the component, as well as all of its own content children, again given as a `DynamicContentChild` array. It is therefore a hierarchical list of all content children, not a flat one.

### 5.6 Change detection:
Dynamically-loaded components are connected to Angular change detection and will be checked when it is triggered like any other part of the app. Setting `ChangeDetectionStrategy.OnPush` on them to limit change detection will work as well. 

The input and output bindings you assign to hooks are checked and updated on every change detection run, which mirrors Angular's default behaviour. This way, if you bind a context property to an input and that property changes, the corresponding component will automatically be updated with the new value for the input and trigger ` ngOnChanges()`. Alternatively, you can also set the option `updateOnPushOnly` to `true` to only update the bindings when the context object changes by reference (see [OutletOptions](#64-outletoptions)).

## 6. Configuration

### 6.1 Global settings:

You can provide a `DynamicHooksGlobalSettings`-object in your app when importing the library via `forRoot()` in your app module. We have already done this in the [Quick Start Example](#4-quick-start) above. This is probably the easiest way to get started, as these settings will be passed to all `OutletComponent`s in your app automatically. The possible global settings are:

Name | Type | Description
--- | --- | ---
`globalParsers` | `HookParserEntry[]` | An list of hook parsers to provide to all `OutletComponents` (see [HookParserEntry](#63-hookparserentry))
`globalOptions` | `OutletOptions` | An options object to provide to all `OutletComponents` (see [OutletOptions](#64-outletoptions))

Note that you don't have to define a global settings object. You can also configure each `OutletComponent` with their [own parsers and options](#62-outlet-component-bindings) as inputs.

### 6.2 Outlet component bindings:
These are all of the inputs you can pass to each `OutletComponent` (`<ngx-dynamic-hooks>`) individually:

Input name | Type | Description
--- | --- | ---
`content` | `string` | The content string to parse and render
`context` | `any` | An optional object to pass data to the dynamically-loaded components
`globalParsersBlacklist` | `string[]` | An optional list of global parsers to blacklist, identified by their name
`globalParsersWhitelist` | `string[]` | An optional list of global parsers to whitelist, identified by their name
`parsers` | `HookParserEntry[]` | An optional list of hook parsers to use instead of the global parsers (see [HookParserEntry](#63-hookparserentry))
`options` | `OutletOptions` | An optional options object to use instead of the global options (see [OutletOptions](#64-outletoptions))

There is also an output you may subscribe to:

Output name | Type | Description
--- | --- | ---
`componentsLoaded` | `Observable<LoadedComponent[]>` | Will trigger once all components have loaded (including [lazy-loaded ones](#65-lazy-loading-components))

Each `LoadedComponent` from the output represents a dynamically-created component and contains some information you may find interesting:

```ts
interface LoadedComponent {
    hookId: number;                     // The unique hook id
    hookValue: HookValue;               // The hook that was replaced by this component
    hookParser: HookParser;             // The associated parser
    componentRef: ComponentRef<any>;    // The created componentRef
}
```

### 6.3 `HookParserEntry`:
Hooks can only be found if they have a corresponding `HookParser`. You can register `HookParser`s in the [global settings](#61-global-settings) or [on each OutletComponent](#62-outlet-component-bindings) individually. Both expect a `HookParserEntry`-array, which is just a fancy alias for several possible values. A `HookParserEntry` can be either:

1. A custom `HookParser` instance.
2. A custom `HookParser` class. If this class is registered as a provider in the root injector, it will used as a service, otherwise it will be instantiated without constructor arguments.
3. A `SelectorHookParserConfig` object literal, which automatically sets up an instance of `SelectorHookParser` for you.

See the section [Writing your own HookParser](#7-writing-your-own-hookparser) for more info about option 1 and 2. 

Option 3 is the easiest and we have already used it in the [Quick Start Example](#4-quick-start) above. A `SelectorHookParserConfig` is an object literal that creates and registers a `SelectorHookParser` for a component of your choice, so that it can be found by its selector in the content string. In its simplest form, it just contains the component class like `{component: ExampleComponent}`, but it also accepts additional properties:

#### `SelectorHookParserConfig` properties:
These mostly determine the details about how the component selector is parsed from the content string. The only required property is `component`.
Property | Type | Default | Description
--- | --- | --- | ---
`component` | `ComponentConfig` | - | The component to be used. Can be its class or a [LazyLoadComponentConfig](#65-lazy-loading-components).
`name` | `string` | - | The name of the parser. Required if you want to black- or whitelist it.
`selector` | `string` | The component selector | The selector to use for the hook
`injector` | `Injector` | The root injector | The injector to create the component with
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

### 6.4 `OutletOptions`:
You can also provide your own `OutletOptions` for each `OutletComponent` and overwrite the default values. These options determine the overall behavior of the outlet, such as of how the content string is rendered and how dynamic components are managed.

Option name | Type | Default | Description
--- | --- | --- | ---
`sanitize` | `boolean` | `true` | Whether to use Angular's `DomSanitizer` to sanitize the content string before output (hooks are unaffected by this)
`convertHTMLEntities` | `boolean` | `true` | Whether to replace HTML entities like `&nbsp;` with normal characters
`fixParagraphTags` | `boolean` | `true` | When using a WYSIWYG-editor, writing enclosing hooks may *rip apart* paragraph HTML (the `<p>`-tag starting before the hook and the corresponding `</p>`-tag ending inside, and vice versa). This will result in weird HTML when rendered in a browser. This setting removes these ripped-apart tags.
`updateOnPushOnly` | `boolean` | `false` | Normally, the bindings of all dynamic components are checked/updated on each change detection run. This setting will update them only when the context object passed to the `OutletComponent` changes by reference.
`compareInputsByValue` | `boolean` | `false` | Whether to deeply-compare inputs for dynamic components by their value instead of by their reference on updates
`compareOutputsByValue` | `boolean` | `false` | Whether to deeply-compare outputs for dynamic components by their value instead of by their reference on updates
`compareByValueDepth` | `boolean` | `5` | When comparing by value, how many levels deep to compare them (may impact performance)
`ignoreInputAliases` | `boolean` | `false` | Whether to ignore input aliases like `@Input('someAlias')` in dynamic components and use the actual property names instead
`ignoreOutputAliases` | `boolean` | `false` | Whether to ignore output aliases like `@Output('someAlias')` in dynamic components and use the actual property names instead
`acceptInputsForAnyProperty` | `boolean` | `false` | Whether to disregard `@Input()`-decorators completely and allow passing in values to any property in dynamic components
`acceptOutputsForAnyObservable` | `boolean` | `false` | Whether to disregard `@Output()`-decorators completely and allow subscribing to any `Observable` in dynamic components

### 6.5 Lazy-loading components:
If you are using the Ivy templating engine (Angular 9+), you can configure your hook parsers in such a way that they lazy-load the component class right when it is needed and the corresponding hook appears in the content string.

You may have noticed that the component-property in `SelectorHookParserConfig` has the type `ComponentConfig` (see [HookParserEntry](#63-hookparserentry)). This means it can be the component class, but also a `LazyLoadComponentConfig`:

```ts
interface LazyLoadComponentConfig {
    importPromise: () => Promise<any>;
    importName: string;
}
```

`importPromise` should be a function that returns the import promise for the component while `importName` should be the name of the component class to be used.  As the selector of the component cannot be known before loading the component class, you will also have to manually specify a selector of your choice for the hook.

The full `SelectorHookParserConfig` for a lazy-loaded component could then look like so:

```ts
{
    component: {
        importPromise: () => import('./components/lazyComponent.c'),
        importName: 'LazyComponent'
    },
    selector: 'app-lazy'
}
```

That's all there is to it! `LazyComponent` will now automatically be lazy-loaded if `<app-lazy>...</app-lazy>` is found in the content string.

**Note:** `importPromise` must contain a function returning the import-promise, not the import-promise itself! Otherwise the promise would be executed right where it is defined, which defeats the point of lazy-loading.

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
import { Injectable } from '@angular/core';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings, HookFinder } from 'ngx-dynamic-hooks';
import { DynamicRouterLinkComponent } from './dynamicRouterLink.c';

@Injectable({
  providedIn: 'root'
})
export class DynamicRouterLinkParser implements HookParser {
    linkOpeningTagRegex;
    linkClosingTagRegex;
    hrefAttrRegex;

    constructor(private hookFinder: HookFinder) {
        // Lets assemble a regex that finds the opening <a>-tags for internal links
        const domainName = this.escapeRegExp(window.location.hostname.replace('www.', '')); // <-- This is our website name
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

## 8. Trivia

### 8.1 How it works:
This library doesn't rely on any special "hacks" to load the dynamic components. Most notably, it uses [ComponentFactory.create()](https://angular.io/api/core/ComponentFactory#create) from Angular's public api, which is safe and has been around since Angular 2.  

It then adds a lot of custom code around this core function to render the components at exactly the right place, register inputs and outputs, project the content properly, activate change detection, update and destroy them automatically, etc. - all to integrate the dynamic components into Angular as naturally as possible. If you are curious about the inner workings of the library, here's a short description:

1. A content string is passed as @Input() to the `OutletComponent` and an array of parsers is retrieved either as another @Input() or from the global settings.
2. The `findHooks()`-method of all registered parsers is called and (with the help of the returned `HookPosition[]`) all found hooks are replaced with component element placeholders.
3. The content string is then parsed by the native browser HTML parser to create a DOM tree, which is then inserted as the innerHTML of the `OutletComponent`.
4. For each found hook, the `loadComponent()`-method of its parser is called to get the component class. This component is then dynamically loaded into the previously created placeholder elements (now existing as actual DOM nodes) as fully-functional Angular components via `ComponentFactory.create()`.
5. For each created component, the `getBindings()`-method of its parser is called and the returned inputs/outputs passed to and subscribed with the component.
6. On future update requests (by default, on every change detection run), `getBindings()` is called again to see if it returns different values than before (for example, if the bindings are generated from data that has since changed). If so, the components will be updated accordingly.
7. When the `OutletComponent` is destroyed, all dynamically-loaded components are destroyed as well.


### 8.2 Security:
One of the goals of this library was to make it **safe to use even with potentially unsafe input**, such as user-generated content. It is also designed to grant developers maximum control over which components are allowed to be loaded, and how. It uses the following techniques to achieve this:

Most notably, it uses Angular's `DOMSanitizer` by default to remove all unsafe HTML, CSS and JS in the content string that is not part of a hook. Though not recommended, you may turn this setting off in the [OutletOptions](#64-outletoptions). You will then have to ensure yourself that the rendered content does not include [Cross Site Scripting attacks (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) or other malicious code, however.

As mentioned, the `DOMSanitizer` does not actually sanitize the hooks themselves (as it may remove them depending on their pattern). This is not an issue as the hooks are replaced by components anyway and never actually rendered. Only the corresponding `HookParser` sees the hook in its original form in order to analyze it. It is therefore the parser's responsibility to ensure that whatever malicious code there may be in the hook is not somehow transferred to the rendered component. For this reason, the standard `SelectorHookParser` that comes with this library does not rely on JavaScript's dangerous `eval()` function to evaluate inputs and outputs and instead internally uses `JSON.parse()` to safely turn strings into variables. **Note:** When writing custom parsers for hooks that take their inputs/outputs directly from the text, make sure to take similar security precautions!

In addition to this, the scope of code that is accessible by the author of the content string is limited to the [context object](#51-context--dependency-injection), which you can customize to your liking. 

Finally, which components/hooks can be used by the author can be [freely adjusted](#63-hookparserentry) for each `OutletComponent`, as can their allowed inputs/outputs.

### 8.3 Caveats:
1. As this library does not parse the content string as an actual Angular template, template syntax such as `*ngIf`, `*ngFor`, attribute bindings `[style.width]="'100px'"`, interpolation `{{ someVar }}` etc. will **not** work! This functionality is not planned to be added either, as it would require a fundamentally different approach by relying on the JiT template compiler, which breaks AoT compatibility and existing security measures.
2. Hooks can only load components, not directives. There's no way to dynamically create directives as far as i'm aware. If you want to load a directive into the content string, try loading a component that contains that directive instead.
3. `@ContentChildren` don't work in dynamically-loaded components, as these have to be known at compile-time. However, you can still access them via [onDynamicMount()](#55-lifecycle-methods).

### 8.4 Comparison with similar libraries:
#### [Angular elements](https://angular.io/guide/elements)
Angular elements allows you to register custom HTML elements (like component selector elements) with the browser itself that automatically load and host an Angular component when they appear anywhere in the DOM (see [Web components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)) - even outside of the Angular app. For that reason, these elements work in dynamic content as well and may satisfy your needs.

However, there are a number of advantages this library offers compared to Angular elements:

* **Hook pattern flexibility:** You are not limited to load components by their selector HTML tags. A hook can have any form and doesn't have to be an HTML element at all. You can automatically replace anything you want with a component, which opens up many possibilities for user-generated content (see [Emoji-example](#72-example-emoji-parser-standalone)) or your own posts (see [Internal links example](#73-example-internal-link-parser-enclosing)).
* **Control:** With Angular elements, you have no say in where the components are allowed be loaded. Web components will automatically load anywhere in- or outside your app as they are globally registered with the browser. With this library however, you can to specify for each `OutletComponent` individually which hooks to use, what components to load for them and which inputs/outputs to give them.
* **Context:** In Angular elements, there is no direct line of communication with the component hosting the dynamic content, such as the [context object](#51-context--dependency-injection) from this library. You will have to fallback on services to transfer data.
* **Bindings:** Though Angular elements allows passing static inputs as HTML attributes to components, it doesn't parse them. This means that all inputs are strings by default and you will have to manually turn them into booleans, arrays, objects etc. yourself. This library parses them automatically for you, much like a normal Angular template - in addition to accepting actual variables from the context object as well.
* **Projected content:** Angular elements doesn't normally render projected content in the component's `<ng-content>`. There is a workaround involving `<slot>`, but its not ideal. This library renders `<ng-content>` normally.

#### [Ng-Dynamic](https://github.com/lacolaco/ng-dynamic)
This library was one of the inspirations for Ngx-Dynamic-Hooks and is unfortunately not maintained anymore. It consited of two parts, but I'll just focus on its `<dynamic-html>`-component, which worked like a simpler version of this library. In short, it looked for a component selector in a content string and simply replaced it with the corresponding component, also using `ComponentFactory.create()`. As that is pretty much all it focused on, it:

* required selector elements to load components (hooks can be anything)
* provided no direct line of communication to the parent component like the context object
* did not automatically handle inputs/outputs in any way
* did not automatically handle projected content in any way
* had no security features whatsoever
* could not be customized through options

Simply think of ngx-dynamic-hooks as a library that picks up the torch from ng-dynamic's `<dynamic-html>`-component and takes it further.

#### [Ngx-Dynamic-Template](https://github.com/apoterenko/ngx-dynamic-template), etc
There are also multiple libraries out there that render full Angular templates dynamically and rely on the JiT-compiler to do so. They are generally incompatible with AoT-compilation (which Ivy uses by default) and are dangerous to use if you do not fully control the content, as all Angular components, directives or template syntax expressions are blindly executed just like in a static template. They also suffer from most of the same drawbacks as the other libraries listed here, such as the lack of flexbility and control etc., so I won't list them seperately here.

## 9. Troubleshooting
**I'm getting the error "`<ngx-dynamic-hooks>` is not a known element" in my templates**

Some editors like VS Code don't always immediately catch on to the newly available components when a module has been imported. Try restarting the editor to see if that helps (it should compile fine, though). If not, check that you have correctly imported the `DynamicHooksModule` into you main module as shown in the [Quick start](#4-quick-start)-section to make everything available.

**I'm getting the error "Data type for following input was not recognized and could not be parsed"**

You most likely have a typo in the input. If its a string, remember to put quotation marks around it ('', "" or ``). If that isn't it, it may help to copy the input into an IDE that is set to JS/TS syntax and have it highlight potential typos for you.

**In my output function, `this` does not point to the parent object of the function**

See the [Outputs-section](#53-outputs) for a solution to this problem.

**The globalParsersBlacklist/whitelist inputs for the `OutletComponent` don't work**

Make sure you have explicitly given the parsers a name (see the [HookParserEntry](#63-hookparserentry)-section on how to do so) that correlates with the black/whitelisted name.

**I'm writing a custom parser. When implementing `loadComponent()`, why are there `<dynamic-component-placeholder>`-elements in the passed `childNodes`?**

At this point in the workflow, the original hooks have already been replaced with the placeholder-elements you see in the `childNodes`. These placeholders are later replaced again with the actual Angular components. Note that if you replace the inner content of the hook and modify or remove these placeholders, the corresponding component may not load correctly!

**I've written a custom parser. `ngOnChanges()` keeps triggering in my dynamic components!**

It is important to remember that `getBindings()` is called anytime the current values of the bindings are requested. By default, that is on component creation and on every change detection run afterwards. If this function parses the bindings from scratch and returns new references for them each time it is called, the bindings are considered to have changed and `ngOnChanges()` in the dynamic components will be triggered (or in the case of an output binding, it will be resubscribed). 

You can avoid that by introducing a persistent state in your parsers and by remembering and reusing the previous references if they haven't changed. If you need a way to tell if the bindings are deeply identical by value for this, you can import the `DeepComparer` service from this library and use the `isEqual()` method (or alternatively use Underscore's [isEqual()](http://underscorejs.org/#isEqual) or Lodash's [isEqual()](https://lodash.com/docs/#isEqual)). If you don't want to bother with any of that, you can also simply set the `compareInputsByValue`/`compareOutputsByValue`-options in `OutletOptions` to true (see [OutletOptions](#64-outletoptions)), which does this automatically, though it will then apply to all active parsers.

**I'm getting the error "TypeError: Object(…) is not a function"**

You might be using Rxjs-version that is older than 6, which was introduced with Angular 6. If you are using Angular 5, either upgrade to 6 or try using [Rxjs compat](https://www.npmjs.com/package/rxjs-compat) to fix this issue.

## 10. Special thanks
Thanks to [ng-dynamic](https://github.com/lacolaco/ng-dynamic) for giving me the idea for this library (as well [this blog post](https://www.arka.com/blog/dynamically-generate-angular-components-from-external-html), which explains it more).

I am also grateful to Jesus Rodriguez & Ward Bell for their [in-depth presentation on the topic](https://www.youtube.com/watch?v=XDzxs00iIDE).