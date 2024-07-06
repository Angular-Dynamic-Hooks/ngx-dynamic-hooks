---
---

# What it does

## Introduction

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

* @Inputs()
* @Outputs()
* Content projection / transcluded content
* Change detection
* Dependency injection / services
* All lifecycle methods

If you are using the Ivy templating engine, you can even lazy-load components right when they are needed. 

For more details about all of these topics, see the following sections.

## What this library doesn't do

Please note that this library does not aim to be a full Angular template parser. It merely looks for all registered hooks and replaces them with their corresponding Angular components, nothing more. 

This means that other special Angular template syntax (such as *ngIf, *ngFor or other directives) **will not work**.

However, in terms of loading components, you have a great deal more flexbility than even in Angular templates, such as allowing components to be loaded by any text pattern, granular control over which components are allowed, adding sanitization etc.