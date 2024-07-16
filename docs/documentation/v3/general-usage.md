---
---

# General usage

There are two ways to use the library in Angular: In a template via the `DynamicHooksComponent` or programmatically via the `DynamicHooksService`.

## Starting out

In the [Quickstart example]({{ 'documentation/v3/quickstart' | relative_url }}), we have already seen how to use the component in a minimal way. Just import the `DynamicHooksComponent` where you need it and pass in your content as well as the components to look for:


```ts
import { Component } from '@angular/core';
import { DynamicHooksComponent } from 'ngx-dynamic-hooks';
import { ExampleComponent } from 'somewhere';

@Component({
  ...
  imports: [DynamicHooksComponent]
})
export class AppComponent {
  content = 'Load a component here: <app-example></app-example>';
  parsers = [ExampleComponent];
}
```

```html
<ngx-dynamic-hooks [content]="content" [parsers]="parsers"></ngx-dynamic-hooks>
```

{% include docs/widgets/notice.html content='
  <span>This example uses a string as the content, but you can always also use an actual HTML element. The hooks/components will be loaded in the same way.</span>
' %}

## Context and options

There are several more inputs for the `DynamicHooksComponent`, most notably **context** to pass data to the loaded components and **options** to configure how the content should be parsed. 

```ts
@Component({
  ...
  imports: [DynamicHooksComponent]
})
export class AppComponent {
  content = 'Load a component here: <app-example [message]="context.someString"></app-example>';
  parsers = [ExampleComponent];
  context = {someString: "Greetings from the context object!"};
}
```

```html
<ngx-dynamic-hooks 
  [content]="content" 
  [parsers]="parsers" 
  [context]="context"
  [options]="{sanitize: false}"
></ngx-dynamic-hooks>
```

In this example, we're passing the value of `context.someString` from the parent component to the `[message]`-input of `ExampleComponent` with the help of the context object. [See here]({{ 'documentation/v3/component-features#context--dependency-injection' | relative_url }}) for detailed info about how to use it.

Also, as we know the content string is safe and does not contain malicous code, we can set the `sanitize`-option to `false` (`true` by default). You can read about all available options on the [configuration page]({{ 'documentation/v3/configuration#parseoptions' | relative_url }}).

See it in action in this Stackblitz:

{% include docs/widgets/notice.html content='
  <span>Live example to be followed!</span>
' %}

## Global settings

If you use `DynamicHooksComponent` more than once, it can become tedious to manually pass along the desired parsers and options every time.

Instead, you can also register them [globally]({{ "documentation/v3/configuration#global-settings" | relative_url }}) in your app providers:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideDynamicHooks } from 'ngx-dynamic-hooks';
import { ExampleComponent } from './components/example/example.component';

export const appConfig: ApplicationConfig = {
  providers: [
    ...
    provideDynamicHooks({
      parsers: [ExampleComponent],
      options: {
        sanitize: false
      }
    })
  ]
};
```

Every `DynamicHookComponent` will then use them by default (unless locally overwritten). Now we can pass just the `content`-input:

```html
<ngx-dynamic-hooks [content]="content"></ngx-dynamic-hooks>
```

See it in action in this Stackblitz:

{% include docs/widgets/notice.html content='
  <span>Live example to be followed!</span>
' %}

{% include docs/widgets/notice.html content='
  <span>If you are using modules, you can put the call to "provideDynamicHooks" into the "providers" decorator field of your module instead.</span>
' %}

You can also call `provideDynamicHooks` again in the providers fields of child injectors, such as in lazily-loaded routes. These [child settings]({{ "documentation/v3/configuration#child-settings" | relative_url }}) will automatically inherit the root settings according to the Angular injector hierarchy.

## Load by any selector

So far, we've been using the component classes themselves as parsers. This is actually a shorthand, as the library automatically sets up a `SelectorHookParser` for each submitted class. If we want, we can manually configure a `SelectorHookParser` instead for more control. 

Let's say we want to load `ExampleComponent`s by the selector `.myWidget` instead of its default element. This might look like so:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    ...
    provideDynamicHooks({
      parsers: [{
        component: ExampleComponent,
        selector: ".myWidget" // Accepts any CSS selector
      }]
    })
  ]
};
```

Now this content string (or equivalent HTML) would work:

```ts
export class AppComponent {
  content = 'Load a component here: <div class="myWidget"></div>';
}
```

As you can see, we replaced the `ExampleComponent` class in the parsers array with a more explicit configuration object that specifies a `selector`. This is a `SelectorHookParserConfig` and it offers several options to customize how a component is parsed from the content (see the [SelectorHookParserConfig]({{ "documentation/v3/parsers#selectorhookparserconfig" | relative_url }}) section for the full list).

See it in action in this Stackblitz:

{% include docs/widgets/notice.html content='
  <span>Live example to be followed!</span>
' %}

## Custom parsers

If you need even more flexiblity (such as replacing pure text with components), you can consider implement your own `HookParser`!

A `HookParser` is quite simple and just needs three methods: One that tells the library where the hooks are in the content, one that says which component class to load and one that returns the input/output values.

For a full guide with stackblitz examples, see the [Writing your own HookParser](http://localhost:4000/ngx-dynamic-hooks/documentation/v3/parsers#writing-your-own-hookparser) section.

## Programmatic usage (with service)

You can also parse dynamic content directly in Typescript by injecting the `DynamicHooksService` and calling its `parse`-method programmatically. The `DynamicHooksComponent` internally does the same thing.

```ts
  parse(
    content: any = null,
    context: any = null,
    globalParsersBlacklist: string[]|null = null,
    globalParsersWhitelist: string[]|null = null,
    parsers: HookParserEntry[]|null = null,
    options: ParseOptions|null = null,
    targetElement: HTMLElement|null = null,
    targetHookIndex: HookIndex = {},
    environmentInjector: EnvironmentInjector|null = null,
    injector: Injector|null = null
  ): Observable<ParseResult>
```

This looks complicated, but most of the parameters are actually just [the inputs]({{ "documentation/v3/configuration#dynamichookscomponent" | relative_url }}) for the `DynamicHooksComponent` component and therefore optional. You really only need to pass the `content` as you would with the component. 

Only the last couple of parameters are notable: You can optionally provide a `targetElement` and `targetHookIndex` to fill out for the result. If not, they are automatically created for you. You may also specify custom injectors for the created components. If you don't, the library defaults to the current ones.

The function will return an `ParseResult` observable:

```ts
interface ParseResult {
    element: any;                                 // The parsed content element
    hookIndex: HookIndex;                         // An object with the generated hook data
    context: any;                                 // The used context object  for the result
    usedParsers: HookParser[];                    // The used parsers for the result
    usedOptions: ParseOptions;                    // The used options for the result
    usedInjector: Injector;                       // The used injector for the result
    usedEnvironmentInjector: EnvironmentInjector; // The used environment injector for the result
    destroy: () => void;                          // Destroys all loaded components of this result
}
```
`element` is probably the most interesting part here as it contains the finished content with all loaded component elements. `hookIndex` might also prove useful, as it is a fairly in-depth data object that holds various tidbits of info concerning the loaded components (as well as the componentRefs). 

Calling this function could then look like so:

```ts
import { DynamicHooksService } from 'ngx-dynamic-hooks';

...
class AppComponent {
  constructor(private dynamicHooksService: DynamicHooksService) {
    
    const content = 'Load a component here: <app-example></app-example>';
    // const content = document.querySelector('#content'); // Also possible

    dynamicHooksService.parse(content).subscribe(result => {
      // Do whatever with it
    });

  }
}
```

See it in action in this Stackblitz:

{% include docs/widgets/notice.html content='
  <span>Live example to be followed!</span>
' %}

{% include docs/widgets/notice.html content="
  <h4>About component lifecycles</h4>
  <p>When loading components this way, keep in mind that the submitted content is only parsed once. The inputs of contained components aren't automatically updated.</p>
  <p>Also, make sure to properly destroy the created components when they are no longer needed to prevent memory leaks. You can simply use <code>ParseResult.destroy()</code> or <code>DynamicHooksService.destroy(hookIndex: HookIndex)</code> for this purpose.</p>
" %}