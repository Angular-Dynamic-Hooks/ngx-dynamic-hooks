---
---

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