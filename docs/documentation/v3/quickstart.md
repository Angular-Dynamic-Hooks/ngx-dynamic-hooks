---
---

# Quick start

## Minimal example

Make sure you have installed the library with:

```sh
npm install ngx-dynamic-hooks
```

Then import the `DynamicHooksComponent` as well as your dynamic component(s) to load:

```ts
import { DynamicHooksComponent } from 'ngx-dynamic-hooks';
import { ExampleComponent } from 'somewhere';

@Component({
  ...
  imports: [DynamicHooksComponent, ExampleComponent]
})
export class AppComponent {
    // A list of components to look for
    components = [ExampleComponent]
}
```
Then just use `<ngx-dynamic-hooks>` where you want to render the content:

```html
<ngx-dynamic-hooks [content]="'Load a component here: <app-example></app-example>'" [parsers]="components"></ngx-dynamic-hooks>
```

That's it! If `<app-example>` is the selector of `ExampleComponent`, it will automatically be loaded in its place, just like in a normal template.