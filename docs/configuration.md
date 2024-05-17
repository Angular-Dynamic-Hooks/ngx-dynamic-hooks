
## 6. Configuration

### 6.1 Global settings:

You can provide a `DynamicHooksGlobalSettings`-object in your app when importing the library via `forRoot()` in your app module. We have already done this in the [Quick Start Example](#4-quick-start) above. This is probably the easiest way to get started, as these settings will be passed to all `OutletComponent`s in your app automatically. The possible global settings are:

Name | Type | Description
--- | --- | ---
`globalParsers` | `HookParserEntry[]` | An list of hook parsers to provide to all `OutletComponents` (see [HookParserEntry](#63-hookparserentry))
`globalOptions` | `OutletOptions` | An options object to provide to all `OutletComponents` (see [OutletOptions](#64-outletoptions))
`lazyInheritance` | `number` | An enum option from `DynamicHooksInheritance` (see [Child modules (forChild)](#65-child-modules-forchild))

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
2. A custom `HookParser` class. If this class is registered as a provider in the nearest injector, it will used as a service, otherwise it will be instantiated without constructor arguments.
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
`injector` | `Injector` | The nearest injector | The injector to create the component with
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
You can also provide your own `OutletOptions` for each `OutletComponent` and overwrite the default values. These options determine the overall behaviour of the outlet, such as of how the content string is rendered and how dynamic components are managed.

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

### 6.5 Child modules (forChild):

If you are using child modules, you can use `DynamicHooksModule.forChild()` to load a subset of dynamic component hook parsers & options along with a child module instead of loading all of them at once via `forRoot()` on the main module.

`DynamicHooksModule.forChild()` works both with eagerly imported child modules as well as [lazily-loaded child modules](https://angular.io/guide/lazy-loading-ngmodules). There are however some differences as to how child settings/components are loaded.

In eagerly imported child modules, the `forChild()` parsers will be **added** to the global root parsers. As a result, every instance of `<ngx-dynamic-hooks>` in your app will use the same list of parsers. This ultimately behaves the same as registering all parsers via `forRoot()`. Meanwhile, options are merged in the order of importing them.

In lazily-loaded child modules, you can modify what parsers & options are used by the child module via the optional `lazyInheritance` option in [DynamicHooksGlobalSettings](#61-global-settings). It accepts a value from the `DynamicHooksInheritance` enum, which are as follows:

1. `DynamicHooksInheritance.All`: (Default) The child module uses all parsers & options from anywhere in the app. 
2. `DynamicHooksInheritance.Linear`: The child module only uses parsers & options from direct module ancestors (such a father and grandfather modules, but not "uncle" modules)
3. `DynamicHooksInheritance.None`: The child module only uses parsers & options defined by itself

If relevant, options are always merged in the following order: Any module options, direct ancestor module options, then own options.

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

***Warning***: Do not use or set the `lazyInheritance` option to anything other than `All` in eagerly-loaded modules. The other options will not work as Angular near-seamlessly merges eager modules with the root module and using it will almost certainly result in unexpected behaviour.

### 6.6 Lazy-loading components:
If you are using the Ivy templating engine (Angular 9+), you can configure your hook parsers in such a way that they lazy-load the component class only if it is needed and the corresponding hook appears in the content string.

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

**Also:** Due to the way Angular component creation works and to prevent bugs, the host elements of lazily-loaded components are not directly inserted into the content string, but are instead wrapped in anchor elements, which serve as placeholders until they are ready.