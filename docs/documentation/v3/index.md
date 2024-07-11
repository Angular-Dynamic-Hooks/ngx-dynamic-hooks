---
---

# Introduction

<div class="badges" markdown="1">
  [![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/MTobisch/ngx-dynamic-hooks/ci-test.yml?style=flat-square&logo=github&label=CI%20tests)](https://github.com/MTobisch/ngx-dynamic-hooks/actions/workflows/ci-test.yml)
  [![Coverage](https://img.shields.io/codecov/c/gh/MTobisch/ngx-dynamic-hooks?style=flat-square)](https://codecov.io/gh/MTobisch/ngx-dynamic-hooks)
  [![NPM](https://img.shields.io/npm/v/ngx-dynamic-hooks?color=orange&style=flat-square)](https://www.npmjs.com/package/ngx-dynamic-hooks)
  [![License](https://img.shields.io/github/license/mtobisch/ngx-dynamic-hooks?color=blue&style=flat-square)](https://github.com/MTobisch/ngx-dynamic-hooks/blob/master/LICENSE.md)
  [![Static Badge](https://img.shields.io/badge/Donate%20-%20Thank%20you!%20-%20%23ff8282?style=flat-square)](https://www.paypal.com/donate/?hosted_button_id=3XVSEZKNQW8HC)
</div>

Angular Dynamic Hooks allows you to load Angular components into dynamic content, such as html strings (similar to a "dynamic" template) or even already-existing html trees. 

Works as part of an Angular app or fully standalone. Load components by selectors or **any text pattern**. No JiT-compiler required - [just install and go]( {{ "/documentation/v3/quickstart" | relative_url }} ).

![ngx-dynamic-hooks-optimize](https://github.com/MTobisch/ngx-dynamic-hooks/assets/12670925/ef27d405-4663-48a5-97b5-ca068d7b67d8)

## Installation

Simply install via npm (or yarn)

```sh
npm install ngx-dynamic-hooks
```

[See the Quickstart page]( {{ "/documentation/v3/quickstart" | relative_url }} ) for an example on how to get going right away.

## Compatibility

| Angular | Version | NPM |
| --- | --- | --- |
| 6 - 12  | 1.x.x | `ngx-dynamic-hooks@^1` |
| 13-16  | 2.x.x | `ngx-dynamic-hooks@^2` |
| 17+  | 3.x.x | `ngx-dynamic-hooks@^3` |

As the library does not rely on a runtime compiler, it works in both JiT- and AoT-environments.

## Highlights

* ⭐ Loads fully-functional Angular components into dynamic content
* 📖 Parses both strings and HTML structures
* 🚀 Can be used fully standalone (load components into HTML without Angular)
* 🏃 Works **without** needing the JiT compiler
* 💻 Works **with** Server-Side-Rendering
* 🔍 Loads components by their selectors, custom selectors or **any text pattern of your choice**
* ⚙️ Services, Inputs/Outputs, Lifecycle Methods and other standard features all work normally
* 💤 Allows lazy-loading components only if they appear in the content
* 🔒 Can pass custom data safely to your components via an optional context object


## What it does

In Angular, you normally load components by placing their selectors in a template. But what if you wanted to load components not just from static templates, but from arbitrary dynamic content as well - such as string variables, HTML elements or even by parsing the whole DOM?

By default, **this is not easily possible**.

<a href="https://www.npmjs.com/package/ngx-dynamic-hooks" target="_blank">Angular Dynamic Hooks</a> aims to solve this shortcoming by providing a component (as well as a service and standalone function) that accepts any content of your choice and automatically loads components into it at runtime - similar to a "dynamic template". The library does not need the Just-in-Time Angular compiler to do so, allowing for much smaller bundle sizes. 

It is able to do all this in a controlled and secure manner by using so-called **hooks**.

![How hooks work](https://i.imgur.com/e9ygec4.png)

## What's a hook?

Simply put, hooks are any HTML element or text pattern in the content to be replaced by an Angular component. 

Hooks can be **singletags** (`<hook>`) or **enclosing** (`<hook>...</hook>`). In most cases, you may simply want to use the normal component selectors as their hooks. You can easily do that with the out-of-the-box `SelectorHookParser` that comes included with this library. 

Just use your selectors just as you would in a normal Angular template (such as `<app-mycomponent [someInput]="'hello!'">...</app-mycomponent>`) and the corresponding components will be loaded in their place. Inputs/Outputs will work even on already-existing HTML elements.

![Selector hook](https://i.imgur.com/tjAX6uU.png)

What is especially neat: Hooks can be anything - not just component selectors! 

Each hook internally has a corresponding `HookParser` that tells the library where and how to instantiate the component. You can easily create [your own hook parsers]({{ "/documentation/v2/parsers" | relative_url }}) that replace any HTML element or text pattern of your choice with Angular components!

## Do the components work normally?

Yes, the dynamically-loaded components are fully-functional as they are created with native Angular methods. They seamlessly integrate into the rest of the app with all features working as expected, such as: 

* *@Inputs()*
* *@Outputs()*
* *Content projection / transcluded content*
* *Change detection*
* *Dependency injection / services*
* *All lifecycle methods*

You can even lazy-load components only when they appear in the content, allowing for much smaller bundle sizes.

For more details about all of these topics, see the following sections.

## What this library doesn't do

Please note that this library does not aim to be a full Angular template parser. It merely looks for all registered hooks and replaces them with their corresponding Angular components, nothing more. 

This means that other special Angular template syntax (such as *ngIf, *ngFor or other directives) **will not work**.

However, in terms of loading components, it allows for a lot more flexibility and possibilities than Vanilla Angular itself, such as allowing you to load them at runtime from normal strings or HTML trees, replace text patterns with components and more.