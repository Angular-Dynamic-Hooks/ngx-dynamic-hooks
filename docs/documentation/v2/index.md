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

With Angular Dynamic Hooks, you can load fully-functional Angular components from string variables - based on their selector (as in normal templates) or **any pattern of your choice**.

![ngx-dynamic-hooks-optimize](https://github.com/MTobisch/ngx-dynamic-hooks/assets/12670925/ef27d405-4663-48a5-97b5-ca068d7b67d8)

## Installation
Simply install via npm 

```sh
npm install ngx-dynamic-hooks
```

or yarn

```sh
yarn add ngx-dynamic-hooks
```

[See the Quickstart page]( {{ "/documentation/v2/quickstart" | relative_url }} ) for an example on how to get going right away.

## Compatibility

| Angular | Version | JiT | AoT | Ivy | NPM |
| --- | --- | --- | --- | --- | --- |
| 6 - 12  | 1.x.x | yes | yes | yes | `ngx-dynamic-hooks@^1` |
| 13 - 16  | 2.x.x | - | yes | yes | `ngx-dynamic-hooks@^2` |
| 17+  | 3.x.x | - | yes | yes | `ngx-dynamic-hooks@^3` |

The library is compatible with both the older template engine (view engine) as well as Ivy. It **does not** rely on a runtime compiler and therefore works in both JiT- and AoT-modes. Feel free to use whichever you like.

## What it does

In Angular, components are loaded when their selector appears in a template. But what if you wanted to load components not just from fixed templates, but arbitrary dynamic content as well - such as from database values, markdown files or any other string variable?

By default, **this is not easily possible**.

Even the `[innerHTML]`-directive provided by Angular, which is typically used to render dynamic HTML content, does not parse Angular template syntax and thus will not load components (not least due to security concerns).

<a href="https://www.npmjs.com/package/ngx-dynamic-hooks" target="_blank">Angular Dynamic Hooks</a> aims to solve this shortcoming by providing a component that acts as an enhanced version of `[innerHTML]` of sorts, allowing developers to dynamically load components from strings in a controlled and secure manner by using so-called **hooks**.

![How hooks work](https://i.imgur.com/e9ygec4.png)

## What's a hook?

Simply put, hooks are any piece of text in the content string to be replaced by an Angular component. 

Hooks can be **singletags** (`<hook>`) or **enclosing** (`<hook>...</hook>`). In most cases, you may simply want to use the normal component selectors as their hooks. You can easily do that with the out-of-the-box `SelectorHookParser` that comes included with this library. 

Just write your selectors just as you would in a normal Angular template (such as `<app-mycomponent [someInput]="'hello!'">...</app-mycomponent>`) and the corresponding components will be loaded in their place.

![Selector hook](https://i.imgur.com/tjAX6uU.png)

Something to note, though, is that hooks can be anything - not just component selectors! 

As each hook internally has a corresponding <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L49" target="_blank">`HookParser`</a> that tells the library how to find and instantiate components, you can create [custom hook parsers]({{ "/documentation/v2/parsers" | relative_url }}) that look for any text pattern of your choice to be replaced by an Angular component!

## Do the components work normally?

Yes, the dynamically-loaded components are fully-functional as they are created with native Angular methods. They seamlessly integrate into the rest of the app with all features working as expected, such as: 

* *@Inputs()*
* *@Outputs()*
* *Content projection / transcluded content*
* *Change detection*
* *Dependency injection / services*
* *All lifecycle methods*

If you are using the Ivy templating engine, you can even lazy-load components right when they are needed. 

For more details about all of these topics, see the following sections.

## What this library doesn't do

Please note that this library does not aim to be a full Angular template parser. It merely looks for all registered hooks and replaces them with their corresponding Angular components, nothing more. 

This means that other special Angular template syntax (such as *ngIf, *ngFor or other directives) **will not work**.

However, in terms of loading components, you have a great deal more flexbility than even in Angular templates, such as allowing components to be loaded by any text pattern, granular control over which components are allowed, adding sanitization etc.
