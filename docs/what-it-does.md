## 3. What it does
In Angular, components are loaded when their selector appears in a template. But what if you wanted to load components not just in fixed templates, but in dynamic content as well - such as in text from a database, markdown files or even just string variables?

The `[innerHTML]`-directive provided by Angular, which is typically used to render dynamic HTML content, might be the first solution to come to mind. However, not least due to security concerns, it isn't parsed for Angular template syntax, so it won't load Angular components.

The Dynamic Hooks library provides you with an outlet-component that acts as an enhanced version of `[innerHTML]` of sorts, allowing you to dynamically load components into a string of content in a controlled and secure manner by using so-called **hooks**.

![How hooks work](https://i.imgur.com/BRnmD2d.png)

### What is a hook? 

Simply put, hooks are any piece of text in the dynamic content to be replaced by an Angular component. Hooks can be **standalone** (`<hook>`) or **enclosing** (`<hook>...</hook>`). To find them, each hook has a corresponding **HookParser** that looks for it and tells the library how to instantiate the component.

In many cases, you might simply want to use the existing component selectors as their hooks. This is why this library comes with an out-of-the-box `SelectorHookParser` that is easy to set up. With it, you can write your selectors just like you would in a normal template (`<app-somecomponent [someInput]="'hello!'">...</app-somecomponent>`) and the corresponding components will be loaded in their place.

![Selector hook](https://i.imgur.com/tjAX6uU.png)

Keep in mind, though, that hooks can be anything - not just component selectors! If you want, you can create custom hook parsers that look for any text pattern of your choice to be replaced by an Angular component! (For examples, [see below](#7-writing-your-own-hookparser))

The dynamically-loaded components are fully-functional and created with native Angular methods. They seamlessly integrate into the rest of the app: @Inputs(), @Outputs(), content projection / transcluded content, change detection, dependency injection and lifecycle methods all work normally. If you are using the Ivy templating engine, you can even lazy-load components right when they are needed. For more details about all of these topics, see the following sections.

>**Note:** This library does not parse the content string as an actual Angular template. It merely looks for all registered hooks and replaces them with their corresponding Angular components. This means that special Angular template syntax will **not** work. On the flipside, this grants a great deal more flexbility and security than just parsing a template, such as allowing components to be loaded by any text pattern, support for both JiT- and AoT-modes, granular control over which components are allowed, sanitization etc.