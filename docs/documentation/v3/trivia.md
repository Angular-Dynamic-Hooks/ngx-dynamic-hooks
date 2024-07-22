---
---

# Trivia

## How it works

Angular Dynamic Hooks doesn't rely on any special "hacks" to load components. Most notably, it simply uses the <a href="https://angular.dev/api/core/createComponent" target="_blank">createComponent()</a> function from Angular's public API, which is safe and has been around in some form since Angular 2.

It then adds a lot of custom code around this core function to render the components at exactly the right place, register inputs and outputs, project the content properly, activate change detection, update and destroy them automatically, etc.

If you are curious about the inner workings of the library, here's a general description:

1. The submitted content is parsed for text hooks via the `findHooks()` function of all submitted parsers. The found hooks are replaced with marked anchor elements.
2. If it isn't already one, the content is parsed by the native browser HTML parser into actual an HTML element.
3. The library then looks for all element hooks via the `findHookElements()` function of all submitted parsers and marks those elements as well.
4. For each found hook, the `loadComponent()`-method of its parser is called to get the component class. With it, the components are loaded into the marked anchor elements via Angular's `createComponent()`.
5. For each created component, the `getBindings()`-method of its parser is called and the returned inputs/outputs passed to and subscribed with the component.
6. On future update requests (by default, on every change detection run), `getBindings()` is called again to see if it returns different values than before. If so, the components will be updated accordingly.
7. When the `DynamicHooksComponent` is destroyed, all dynamically-loaded components are destroyed as well.

## Security

One of the goals of this library was to make it **safe to use even with potentially unsafe input**, such as user-generated content. It also allows developers easy control over which components can load and how. It uses the following techniques to achieve this:

Most notably, it uses Angular's `DOMSanitizer` by default to remove all unsafe HTML, CSS and JS in the content. If you want, you may turn this setting off in the [ParseOptions]({{ "documentation/v3/configuration#parseoptions" | relative_url }}). You will then have to ensure yourself that the rendered content does not include <a href="https://en.wikipedia.org/wiki/Cross-site_scripting" target="_blank">Cross Site Scripting attacks (XSS)</a> or other malicious code, however.

To prevent attack vectors through component bindings like inputs, the standard `SelectorHookParser` that comes with this library does not rely on JavaScript's dangerous `eval()` function to evaluate them and instead internally uses `JSON.parse()` to safely turn strings into variables. Ensure that when writing custom parsers for hooks that take their inputs/outputs directly from untrusted content, similar security precautions are taken!

In addition, the scope of code that is accessible to the (perhaps also untrusted) author of the content is limited by the [context object]({{ "documentation/v3/component-features" | relative_url }}), which you can customize to your liking. 

Finally, which components/hooks can be used by the author can be [freely adjusted]({{ "documentation/v3/configuration#dynamichookscomponent" | relative_url }}) for each `DynamicHooksComponent`, as can their allowed inputs/outputs.

## Caveats

1. As this library does not parse the content string as an actual Angular template, template syntax such as `*ngIf`, `*ngFor`, attribute bindings `[style.width]="'100px'"`, interpolation `{% raw %}{{ someVar }}{% endraw %}` etc. will **not** work! This functionality is not planned to be added either, as it would require a fundamentally different approach by relying on the JiT template compiler (which this library intentionally doesn't) or even creating a custom Angular template parser.
2. Hooks can only load components, not directives. There's no way to dynamically create directives as far as i'm aware. If you want to load a directive, try loading a component that contains that directive instead.
3. Accessing `@ContentChildren` does not work in dynamically-loaded components, as these have to be known at compile-time. However, you can still access them via [onDynamicMount()]({{ "documentation/v3/component-features#lifecycle-methods" | relative_url }}).

## Comparison with similar libraries

### <a href="https://angular.dev/guide/elements" target="_blank">Angular elements</a>

Angular elements allows you to register custom HTML elements with the browser that automatically load and host an Angular component when they appear anywhere in the DOM (see <a href="https://developer.mozilla.org/en-US/docs/Web/Web_Components" target="_blank">Web components</a>) - even outside of the Angular app. 

For that reason, these elements work in dynamic content as well and may satisfy your needs. The approach itself is particularly similar to the [Standalone mode]({{ "documentation/v3/standalone" | relative_url }}) of Angular Dynamic Hooks.

However, there are a number of advantages this library offers compared to Angular elements:

* **Pattern flexibility:** You are not limited to load components by unique HTML elements. A hook can have any form, be any element or even consist of just text (see the ["Emoji parser" example]({{ "documentation/v3/parsers#example-2-emoji-parser" | relative_url }})).
* **Lazy-loading:** You can easily set up components to [lazily-load]({{ "documentation/v3/configuration#lazy-loading-components" | relative_url }}) only when they appear in the content instead of having to load all the code upfront.
* **Scope:** When using Angular elements, web components will automatically load from anywhere in the DOM as they are globally registered with the browser. With this library, you can always specify exactly which components to look for in which content.
* **Communication:** If you have a parent app that uses Angular elements to load componments, it can be difficult to communicate with them. With this library, you can easily use the [context object (or dependency injection)]({{ "documentation/v3/component-features" | relative_url }}) to transfer data.
* **Bindings:** In Angular elements, all inputs are strings by default and you will have to manually turn them into booleans, arrays, objects etc. yourself. This library parses them automatically for you, much like a normal Angular template.
* **Projected content:** Angular elements doesn't normally render projected content in the component's `<ng-content>`. There is a workaround involving `<slot>`, but its not ideal. This library renders `<ng-content>` normally.

### <a href="https://github.com/lacolaco/ng-dynamic" target="_blank">Ng-Dynamic</a>

Ng-Dynamic was one of the inspirations for this library and is unfortunately not maintained anymore. It consited of two parts, but I'll just focus on its `<dynamic-html>`-component, which worked like a simpler version of this library. In short, it looked for a component selector in a content string and simply replaced it with the corresponding component, also using `ComponentFactory.create()`. As that is pretty much all it focused on, it:

* required selector elements to load components (hooks can be anything)
* provided no direct line of communication to the parent component like the context object
* did not automatically handle inputs/outputs in any way
* did not automatically handle projected content in any way
* had no security features whatsoever
* could not be customized through options

One can think of Angular Dynamic Hooks picking up the torch from ng-dynamic's `<dynamic-html>`-component and taking it further.

### Runtime compilation, <a href="https://github.com/patrikx3/angular-compile" target="_blank">Angular compile</a>, etc.

There are also multiple libraries out there that render full Angular templates dynamically, but rely on the JiT-compiler to do so. Many of them do not offer support for AoT-compilation (which Angular uses by default) and its many advantages. 

A significant downside with all of them is that including the JiT-compiler in your bundled code will unfortunately increase its size dramatically.

Depending in the content, rendering a dynamic template as though it were a static file can also be dangerous if you do not fully control the content, as all Angular components, directives or template syntax expressions are blindly executed just like in a static template. 

In general, runtime compilation suffers from most of the same drawbacks as the other libraries listed here, such as the lack of flexbility and control etc., so I won't list them seperately here. 

## Special thanks

Thanks to <a href="https://github.com/lacolaco/ng-dynamic" target="_blank">Ng-Dynamic</a> for giving me the idea for this library (as well <a href="https://www.arka.com/blog/dynamically-generate-angular-components-from-external-html" target="_blank">this blog post</a>, which explains it more).

I am also grateful to Jesus Rodriguez & Ward Bell for their <a href="https://www.youtube.com/watch?v=XDzxs00iIDE" target="_blank">in-depth presentation on the topic</a>.