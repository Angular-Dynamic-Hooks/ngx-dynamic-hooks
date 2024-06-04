---
---

# Quick start

## Minimal example

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

## See it in action

The following <a href="https://stackblitz.com/edit/ngx-dynamic-hooks-quickstart" target="_blank">Stackblitz example</a> showcases how to load a couple of simple components from a string:

<iframe src="https://stackblitz.com/edit/ngx-dynamic-hooks-quickstart?embed=1&file=src%2Fapp%2Fapp.component.ts&hideNavigation=1"></iframe>

This is a very simple example. Check out the [Configuration]({{ "documentation/v2/configuration" | relative_url }}) or even [Writing your own HookParser]({{ "documentation/v2/parsers#writing-your-own-hookparser" | relative_url }}) sections to find out how to tailor everything to your exact needs.