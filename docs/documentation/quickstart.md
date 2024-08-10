---
---

# Quick start

## Minimal example

Install the library with:

```sh
npm install ngx-dynamic-hooks
```

Then import the `DynamicHooksComponent` as well as your dynamic component(s) to load:

```ts
import { Component } from '@angular/core';
import { DynamicHooksComponent } from 'ngx-dynamic-hooks';
import { ExampleComponent } from 'somewhere';

@Component({
  ...
  imports: [DynamicHooksComponent]
})
export class AppComponent {

  // The content to parse
  content = 'Load a component here: <app-example></app-example>';

  // A list of components to look for
  parsers = [ExampleComponent];
  
}
```
You can now use the `DynamicHooksComponent` (`<ngx-dynamic-hooks>`) where you want to render the content:

```html
<ngx-dynamic-hooks [content]="content" [parsers]="parsers"></ngx-dynamic-hooks>
```

That's it! If `<app-example>` is the selector of `ExampleComponent`, it will automatically be loaded in its place, just like in a normal template.

## See it in action

{% include docs/widgets/notice.html content='
  <span>Live example to be followed!</span>
' %}

## About using modules

If your app uses modules instead of the new standalone components structure, you can import the `DynamicHooksComponent` there instead:

```ts
@NgModule({
  ...
  imports: [DynamicHooksComponent],
  declarations: [ExampleComponent]
})
export class AppModule {}
```

## Next steps

Please note that the above is a minimal example and that there are plenty more features and options available to you. You can read about them on these pages:

- The [Introduction]({{ "documentation" | relative_url }}) page explains what a hook is and what the library is for.
- The [General usage]({{ "documentation/general-usage" | relative_url }}) page shows you the most common ways to use the library when used as part of an Angular app.
- The [Standalone mode]({{ "documentation/standalone-mode" | relative_url }}) page explains how to use the library without Angular, allowing you to load fully-functional Angular components freely in other contexts (CMS, static HTML, etc).
- The [Component features]({{ "documentation/component-features" | relative_url }}) page shows how to pass data to your dynamically-loaded components, subscribe to their outputs, special lifecycle methods, etc.
- The [Configuration]({{ "documentation/configuration" | relative_url }}) page gives an overview of all the options and settings available to you.
- The [Parsers]({{ "documentation/parsers" | relative_url }}) page lists the various ways to find components - including writing your own parsers!