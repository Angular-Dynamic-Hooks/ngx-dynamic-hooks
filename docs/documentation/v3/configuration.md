---
---

# Configuration

## Global settings

You can optionally set up global parsers and options shared between all `DynamicHookComponent`s in your app by using the `provideDynamicHooks` function in your app providers. [See an example here]({{ "documentation/v3/general-usage#global-settings" | relative_url }}). 

It accepts a `DynamicHooksSettings`-object with the following properties:

Name | Type | Description
--- | --- | ---
`parsers` | <a href="{{ '/documentation/v3/parsers' | relative_url }}">HookParserEntry</a>`[]` | An list of hook parsers to provide to all `DynamicHookComponent`s
`options` | <a href="{{ '/documentation/v3/configuration#parseoptions' | relative_url }}">ParseOptions</a> | An options object to provide to all `DynamicHookComponent`s
`inheritance` | `number` | An enum option from <a href="{{ '/documentation/v3/configuration#child-settings' | relative_url }}">DynamicHooksInheritance</a>

## Child settings

You can provide additional parsers and options simply by calling `provideDynamicHooks` again in the `providers`-fields of child injector contexts, such on <a href="https://angular.dev/api/router/Route#providers" target="_blank">specific routes</a> or even directly on <a href="https://angular.dev/api/core/Component#providers" target="_blank">components</a>. 

The child settings will be merged with other provided settings according to the value of the optional `inheritance` property in the [DynamicHooksSettings]({{ "documentation/v3/configuration#global-settings" | relative_url }}) object. It accepts a value from the `DynamicHooksInheritance` enum, which are as follows:

1. `DynamicHooksInheritance.Linear`: (Default) Only merges with settings from direct ancestor injectors (such a father and grandfather injectors, but not "uncle" injectors).
2. `DynamicHooksInheritance.All`: Merges with settings from all injectors in the app.
3. `DynamicHooksInheritance.None`: Does not merge at all. Injector only uses own settings.

An example for using child settings might then look like this:

```ts
providers: [
  ...
  provideDynamicHooks({
    parsers: [ ... ],
    options: { ... },
    inheritance: DynamicHooksInheritance.None
  })
]
```

## DynamicHooksComponent

These are all of the inputs you can pass to each `DynamicHooksComponent` (`<ngx-dynamic-hooks>`) individually:

Input name | Type | Description
--- | --- | ---
`content` | `any` | The content to parse and render. Can be a string or HTML element.
`context` | `any` | An optional object to pass data to the dynamically-loaded components
`globalParsersBlacklist` | `string[]` | An optional list of global parsers to blacklist, identified by their name
`globalParsersWhitelist` | `string[]` | An optional list of global parsers to whitelist, identified by their name
`parsers` | <a href="{{ '/documentation/v3/parsers' | relative_url }}">HookParserEntry</a>`[]` | An optional list of hook parsers to use instead of the global parsers
`options` | <a href="{{ '/documentation/v3/configuration#parseoptions' | relative_url }}">ParseOptions</a> | An optional options object to use instead of the global options

There is also an output you may subscribe to:

Output name | Type | Description
--- | --- | ---
`componentsLoaded` | `Observable<LoadedComponent[]>` | Will trigger once all components have loaded (including [lazy-loaded ones]({{ "documentation/v3/configuration#lazy-loading-components" | relative_url }}))

Each `LoadedComponent` from the output represents a dynamically-created component and contains some information you may find interesting:

```ts
interface LoadedComponent {
    hookId: number;                     // The unique hook id
    hookValue: HookValue;               // The hook that was replaced by this component
    hookParser: HookParser;             // The associated parser
    componentRef: ComponentRef<any>;    // The created componentRef
}
```

## ParseOptions

You can define `ParseOptions` both in the global settings as well as on each `DynamicHooksComponent` indidually (to overwrite the global values). 

These options can be used to customize the parsing behaviour:

Option name | Type | Default | Description
--- | --- | --- | ---
`sanitize` | `boolean` | `depends` | Whether to use Angular's `DomSanitizer` to sanitize the content (hooks are unaffected by this). Defaults to `true` if content is a string, `false` if its an HTML element.
`convertHTMLEntities` | `boolean` | `true` | Whether to replace HTML entities like `&amp;` with normal characters.
`fixParagraphTags` | `boolean` | `true` | When using a WYSIWYG-editor, enclosing text hooks may collide with its generated HTML (the `<p>`-tag starting before the hook and the corresponding `</p>`-tag ending inside, and vice versa). This will result in faulty HTML when rendered in a browser. This setting removes these ripped-apart tags.
`updateOnPushOnly` | `boolean` | `false` | Whether to update the bindings of dynamic components only when the context object passed to the `DynamicHooksComponent` changes by reference.
`compareInputsByValue` | `boolean` | `false` | Whether to deeply-compare inputs for dynamic components by their value instead of by their reference on updates.
`compareOutputsByValue` | `boolean` | `false` | Whether to deeply-compare outputs for dynamic components by their value instead of by their reference on updates.
`compareByValueDepth` | `number` | `5` | When comparing by value, how many levels deep to compare them (may impact performance).
`triggerDOMEvents` | `boolean` | `depends` | Whether to emit <a href="https://developer.mozilla.org/en-US/docs/Web/Events/Creating_and_triggering_events" target="_blank">CustomEvents</a> from the component host elements when an output emits. The event name will be the output name. Defaults to true in standalone mode, otherwise false.
`ignoreInputAliases` | `boolean` | `false` | Whether to ignore input aliases like `@Input('someAlias')` in dynamic components and use the actual property names instead.
`ignoreOutputAliases` | `boolean` | `false` | Whether to ignore output aliases like `@Output('someAlias')` in dynamic components and use the actual property names instead.
`acceptInputsForAnyProperty` | `boolean` | `false` | Whether to disregard `@Input()`-decorators completely and allow passing in values to any property in dynamic components.
`acceptOutputsForAnyObservable` | `boolean` | `false` | Whether to disregard `@Output()`-decorators completely and allow subscribing to any `Observable` in dynamic components.
`logOptions` | `LogOptions` | `{dev: true}` | Accepts a `LogOptions` object to customize when to log text, warnings and errors.

## Lazy-loading components

You can configure components to lazy-load only when its corresponding hook appears in the content. This reduces the initial bundle size and saves bandwidth if the hook does not appear at all.

To enable this feature, you need to use a `LazyLoadComponentConfig` when setting up your hook parsers:

```ts
interface LazyLoadComponentConfig {
    importPromise: () => Promise<any>;
    importName: string;
}
```

`importPromise` should be a function that returns the import promise for the component file while `importName` should be the name of the exported component class to be used.

With standard selector hooks, you can use this `LazyLoadComponentConfig` in the `component`-field of a [SelectorHookParserConfig]({{ "documentation/v3/parsers#selectorhookparserconfig" | relative_url }}). You also need to manually specify a selector to look for, as it cannot be known before loading the component class. All this would look like so:

```ts
import { Component } from '@angular/core';
import { DynamicHooksComponent } from 'ngx-dynamic-hooks';

@Component({
  ...
  imports: [DynamicHooksComponent]
})
export class AppComponent {
  content = 'Load a component here: <app-lazy></app-lazy>';
  parsers = [
    {
      component: {
        importPromise: () => import('./components/lazyComponent'),
        importName: 'LazyComponent'
      },
      selector: 'app-lazy'
    }
  ]
}
```

```html
<ngx-dynamic-hooks [content]="content" [parsers]="parsers"></ngx-dynamic-hooks>
```

That's all there is to it! `LazyComponent` will now be lazily-loaded if `<app-lazy>...</app-lazy>` is found in the content.

**Tip:** It you are using a custom parser, you can pass your `LazyLoadComponentConfig` in the `HookComponentData` returned by `loadComponent()` instead.

{% include docs/widgets/notice.html content="
  <p>Note that <code>importPromise</code> must contain a function returning the import-promise, not the import-promise itself! Otherwise the promise would be executed right where it is defined, which defeats the point of lazy-loading.</p>
" %}

## Alternative platforms

The default implementation of the library should work in both <a href="https://angular.dev/api/platform-browser/bootstrapApplication" target="_blank">browsers</a> as well as during <a href="https://angular.dev/guide/ssr" target="_blank">server-side-rendering</a>. However, there may be more specialized use cases on platforms that are not directly supported.

In such cases, you can create your own `PlatformService`. The `PlatformService` is internally used as a layer of abstraction between the library and the platform it runs on. It offers several functions to interact with the platform and handles platform-specific objects (such as `document` and `HTMLElement` in the case of the default `PlatformService`).

You can implement your own `PlatformService` by creating a class that follows the `PlatformService` interface and pass it as the second parameter to [provideDynamicHooks]({{ "documentation/v3/configuration#global-settings" | relative_url }}).

**Tip:** You can partially implement as many methods as you need. For all non-implemented methods, the library falls back to the default `PlatformService`.