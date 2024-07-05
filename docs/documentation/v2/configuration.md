---
---

# Configuration

## Global settings

When importing the library via `forRoot()`, you can provide a <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/globalSettings.ts" target="_blank">`DynamicHooksGlobalSettings`</a>-object to set up the global configuration. We have already done this in the [Quick start example]({{ "documentation/v2/quickstart" | relative_url }}). All of those settings will be passed to `OutletComponent`s in your app automatically. The possible values are:

Name | Type | Description
--- | --- | ---
`globalParsers` | <a href="{{ '/documentation/v2/parsers' | relative_url }}">HookParserEntry</a>`[]` | An list of hook parsers to provide to all `OutletComponents`
`globalOptions` | <a href="{{ '/documentation/v2/configuration#outletoptions' | relative_url }}">OutletOptions</a> | An options object to provide to all `OutletComponents`
`lazyInheritance` | `number` | An enum option from <a href="{{ '/documentation/v2/configuration#child-modules' | relative_url }}">DynamicHooksInheritance</a>

Note that you don't have to define a global settings object. You can also configure each `OutletComponent` with their [own parsers and options]({{ "documentation/v2/configuration#component-bindings" | relative_url }}) as inputs.

## Component bindings

These are all of the inputs you can pass to each `OutletComponent` (`<ngx-dynamic-hooks>`) individually:

Input name | Type | Description
--- | --- | ---
`content` | `string` | The content string to parse and render
`context` | `any` | An optional object to pass data to the dynamically-loaded components
`globalParsersBlacklist` | `string[]` | An optional list of global parsers to blacklist, identified by their name
`globalParsersWhitelist` | `string[]` | An optional list of global parsers to whitelist, identified by their name
`parsers` | <a href="{{ '/documentation/v2/parsers' | relative_url }}">HookParserEntry</a>`[]` | An optional list of hook parsers to use instead of the global parsers
`options` | <a href="{{ '/documentation/v2/configuration#outletoptions' | relative_url }}">OutletOptions</a> | An optional options object to use instead of the global options

There is also an output you may subscribe to:

Output name | Type | Description
--- | --- | ---
`componentsLoaded` | <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L214" target="_blank">`Observable<LoadedComponent[]>`</a> | Will trigger once all components have loaded (including [lazy-loaded ones]({{ "documentation/v2/configuration#lazy-loading-components" | relative_url }}))

Each <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L214" target="_blank">`LoadedComponent`</a> from the output represents a dynamically-created component and contains some information you may find interesting:

```ts
interface LoadedComponent {
    hookId: number;                     // The unique hook id
    hookValue: HookValue;               // The hook that was replaced by this component
    hookParser: HookParser;             // The associated parser
    componentRef: ComponentRef<any>;    // The created componentRef
}
```

## OutletOptions
You can define <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/components/outlet/options/options.ts" target="_blank">`OutletOptions`</a> both in the global settings as well as on each `OutletComponent` indidually (to overwrite the global values). 

These options determine the overall behaviour of the outlet, such as of how the content string is rendered and how dynamic components are managed.

Option name | Type | Default | Description
--- | --- | --- | ---
`sanitize` | `boolean` | `true` | Whether to use Angular's `DomSanitizer` to sanitize the content string before output (hooks are unaffected by this)
`convertHTMLEntities` | `boolean` | `true` | Whether to replace HTML entities like `&amp;` with normal characters
`fixParagraphTags` | `boolean` | `true` | When using a WYSIWYG-editor, writing enclosing hooks may *rip apart* paragraph HTML (the `<p>`-tag starting before the hook and the corresponding `</p>`-tag ending inside, and vice versa). This will result in weird HTML when rendered in a browser. This setting removes these ripped-apart tags.
`updateOnPushOnly` | `boolean` | `false` | Normally, the bindings of all dynamic components are checked/updated on each change detection run. This setting will update them only when the context object passed to the `OutletComponent` changes by reference.
`compareInputsByValue` | `boolean` | `false` | Whether to deeply-compare inputs for dynamic components by their value instead of by their reference on updates
`compareOutputsByValue` | `boolean` | `false` | Whether to deeply-compare outputs for dynamic components by their value instead of by their reference on updates
`compareByValueDepth` | `number` | `5` | When comparing by value, how many levels deep to compare them (may impact performance)
`ignoreInputAliases` | `boolean` | `false` | Whether to ignore input aliases like `@Input('someAlias')` in dynamic components and use the actual property names instead
`ignoreOutputAliases` | `boolean` | `false` | Whether to ignore output aliases like `@Output('someAlias')` in dynamic components and use the actual property names instead
`acceptInputsForAnyProperty` | `boolean` | `false` | Whether to disregard `@Input()`-decorators completely and allow passing in values to any property in dynamic components
`acceptOutputsForAnyObservable` | `boolean` | `false` | Whether to disregard `@Output()`-decorators completely and allow subscribing to any `Observable` in dynamic components

## Child modules

If you have child modules, you can use `DynamicHooksModule.forChild()` to import the library into them as well. Without further configuration, the child module will simply inherit the root settings. 

You can however also use this function to register additional parsers and options instead of loading all of them at once via `forRoot()` on the main module. This works with both with eagerly imported child modules as well as <a href="https://v17.angular.io/guide/lazy-loading-ngmodules" target="_blank">lazily-loaded child modules</a>. But there are some differences in how they behave:

In **eagerly** imported child modules, the `forChild()` parsers will be added to the global root parsers. As a result, every `<ngx-dynamic-hooks>` component in your app will use the same list of parsers. This ultimately behaves the same as registering all parsers via `forRoot()`. Meanwhile, options are merged in the order of importing them.

In **lazily** loaded child modules, you can modify what parsers & options are available to the child module via the optional `lazyInheritance` option in [DynamicHooksGlobalSettings]({{ "documentation/v2/configuration#global-settings" | relative_url }}). It accepts a value from the <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/globalSettings.ts" target="_blank">`DynamicHooksInheritance`</a> enum, which are as follows:

1. <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/globalSettings.ts" target="_blank">`DynamicHooksInheritance.All`</a> : The module uses all parsers & options from anywhere in the app. (default) 
2. <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/globalSettings.ts" target="_blank">`DynamicHooksInheritance.Linear`</a> : The module only uses parsers & options from direct module ancestors (such a father and grandfather modules, but not "uncle" modules)
3. <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/globalSettings.ts" target="_blank">`DynamicHooksInheritance.None`</a> : The module only uses parsers & options defined by itself

If relevant, module options overwrite each other in the following order: Any module, direct ancestor modules, then own module.

An example for a lazily-loaded child module might then look like this:

```
import { DynamicHooksModule, DynamicHooksInheritance } from 'ngx-dynamic-hooks';

@NgModule({
  ...
  imports: [
    DynamicHooksModule.forChild({
        globalParsers: [
          {component: ChildDynamicComponent}
        ],
        globalOptions: {
            // whatever you like for this module
        }
        lazyInheritance: DynamicHooksInheritance.Linear
      })
  ],
})
export class LazilyLoadedChildModule {}
```

{% include docs/widgets/notice.html content="
  <h4>Warning</h4>
  <p>Do not use or set the <code>lazyInheritance</code> option to anything other than <code>All</code> in eagerly-loaded modules. The other options will not work as Angular near-seamlessly merges eager modules with the root module and using it will almost certainly result in unexpected behaviour.</p>
" %}

## Lazy-loading components
If you are using the Ivy templating engine (Angular 9+), you can configure your hook parsers in such a way that they lazy-load the component class only if it is needed and the corresponding hook appears in the content string.

You may have noticed that the component-property in <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/parsers/selector/config/selectorHookParserConfig.ts" target="_blank">`SelectorHookParserConfig`</a> has the type <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L126" target="_blank">`ComponentConfig`</a> (see [Parsers]({{ "documentation/v2/parsers#selectorhookparserconfig" | relative_url }}) section). This means it can be the component class, but also a <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L140" target="_blank">`LazyLoadComponentConfig`</a>:

```ts
interface LazyLoadComponentConfig {
    importPromise: () => Promise<any>;
    importName: string;
}
```

`importPromise` should be a function that returns the import promise for the component while `importName` should be the name of the component class to be used.  As the selector of the component cannot be known before loading the component class, you will also have to manually specify a selector of your choice for the hook.

The full <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/parsers/selector/config/selectorHookParserConfig.ts" target="_blank">`SelectorHookParserConfig`</a> for a lazy-loaded component could then look like so:

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

{% include docs/widgets/notice.html content="
  <h4>Note</h4>
  <p><code>importPromise</code> must contain a function returning the import-promise, not the import-promise itself! Otherwise the promise would be executed right where it is defined, which defeats the point of lazy-loading.</p>
" %}

**Also:** Due to the way Angular component creation works and to prevent bugs, the host elements of lazily-loaded components are not directly inserted into the content string, but are instead wrapped in anchor elements, which serve as placeholders until they are ready.