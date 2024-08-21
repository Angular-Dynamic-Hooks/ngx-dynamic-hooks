<img align="left" width="45" height="90" src="https://github.com/angular-dynamic-hooks/ngx-dynamic-hooks/assets/12670925/5322c5e3-121b-4a43-906d-6a440b909919" alt="The logo for the Angular Dynamic Hooks library">

# Angular Dynamic Hooks

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/angular-dynamic-hooks/ngx-dynamic-hooks/ci-test.yml?style=flat-square&logo=github&label=CI%20tests)](https://github.com/angular-dynamic-hooks/ngx-dynamic-hooks/actions/workflows/ci-test.yml)
[![Coverage](https://img.shields.io/codecov/c/gh/angular-dynamic-hooks/ngx-dynamic-hooks?style=flat-square)](https://codecov.io/gh/angular-dynamic-hooks/ngx-dynamic-hooks)
[![NPM](https://img.shields.io/npm/v/ngx-dynamic-hooks?color=orange&style=flat-square)](https://www.npmjs.com/package/ngx-dynamic-hooks)
[![License](https://img.shields.io/github/license/angular-dynamic-hooks/ngx-dynamic-hooks?color=blue&style=flat-square)](https://github.com/angular-dynamic-hooks/ngx-dynamic-hooks/blob/master/LICENSE.md)
[![Static Badge](https://img.shields.io/badge/Donate%20-%20Thank%20you!%20-%20%23ff8282?style=flat-square)](https://www.paypal.com/donate/?hosted_button_id=3XVSEZKNQW8HC)

Angular Dynamic Hooks allows you to load Angular components into dynamic content, such as HTML strings (similar to a "dynamic" template) or even already-existing HTML structures. 

Works as part of an Angular app or fully standalone. Load components by selectors or **any text pattern**. No JiT-compiler required - [just install and go](https://angular-dynamic-hooks.com/guide/quickstart).

![A short animated gif showing how to use the Angular Dynamic Hooks library to load components](https://github.com/angular-dynamic-hooks/ngx-dynamic-hooks/assets/12670925/ef27d405-4663-48a5-97b5-ca068d7b67d8)

# Installation

Simply install via npm (or yarn)

```sh
npm install ngx-dynamic-hooks
```

# Compatibility

| Angular | Version | NPM |
| --- | --- | --- |
| 6 - 12  | 1.x.x | `ngx-dynamic-hooks@^1` |
| 13-16  | 2.x.x | `ngx-dynamic-hooks@^2` |
| 17+  | 3.x.x | `ngx-dynamic-hooks@^3` |

As the library does not rely on a runtime compiler, it works in both JiT- and AoT-environments.

# Quickstart

Import the `DynamicHooksComponent` as well as your dynamic component(s) to load:

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
Then just use `<ngx-dynamic-hooks>` where you want to render the content:

```html
<ngx-dynamic-hooks [content]="content" [parsers]="components"></ngx-dynamic-hooks>
```

That's it! If `<app-example>` is the selector of `ExampleComponent`, it will automatically be loaded in its place, just like in a normal template.

# Documentation

Please note that the above is a very minimal example and that there are plenty more features and options available to you. [Check out the docs](https://angular-dynamic-hooks.com/guide/) to find out how to tailor the library to your exact needs. Highlights include:

* ⭐ Loads fully-functional Angular components into dynamic content
* 📖 Parses both strings and HTML structures
* 🚀 Can be used fully standalone (load components into HTML without Angular)
* 🏃 Works **without** needing the JiT compiler
* 💻 Works **with** Server-Side-Rendering
* 🔍 Loads components by their selectors, custom selectors or **any text pattern of your choice**
* ⚙️ Services, Inputs/Outputs, Lifecycle Methods and other standard features all work normally
* 💤 Allows lazy-loading components only if they appear in the content
* 🔒 Can pass custom data safely to your components via an optional context object

# Donate

If you like the the library and would like to support the ongoing development, maintenance and free technical support, you can [consider making a small donation](https://www.paypal.com/donate/?hosted_button_id=3XVSEZKNQW8HC). Your help is greatly appreciated - Thank you!

# Issues

Please post bugs or any bigger or smaller questions you might have in the issues tab and I will have a look at them as soon as possible.