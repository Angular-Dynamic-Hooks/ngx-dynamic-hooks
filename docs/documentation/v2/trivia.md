---
---

# Trivia

## How it works

This library doesn't rely on any special "hacks" to load the dynamic components. Most notably, it uses <a href="https://angular.io/api/core/ComponentFactory#create" target="_blank">ComponentFactory.create()</a> from Angular's public api, which is safe and has been around since Angular 2.  

It then adds a lot of custom code around this core function to render the components at exactly the right place, register inputs and outputs, project the content properly, activate change detection, update and destroy them automatically, etc. - all to integrate the dynamic components into Angular as naturally as possible.

If you are curious about the inner workings of the library, here's a short description:

1. A content string is passed as @Input() to the `OutletComponent` and an array of parsers is retrieved either as another @Input() or from the global settings.
2. The `findHooks()`-method of all registered parsers is called and (with the help of the returned <a href="https://github.com/MTobisch/ngx-dynamic-hooks/blob/9b31ba5872a057c33a5464f638ac234fd6144963/projects/ngx-dynamic-hooks/src/lib/interfacesPublic.ts#L96" target="_blank">`HookPosition[]`</a>) all found hooks are replaced with placeholders.
3. The content string is then parsed by the native browser HTML parser to create a DOM tree, which is then inserted as the innerHTML of the `OutletComponent`.
4. For each found hook, the `loadComponent()`-method of its parser is called to get the component class. The placeholder elements are replaced with the final component host elements and the components dynamically loaded via `ComponentFactory.create()`.
5. For each created component, the `getBindings()`-method of its parser is called and the returned inputs/outputs passed to and subscribed with the component.
6. On future update requests (by default, on every change detection run), `getBindings()` is called again to see if it returns different values than before (for example, if the bindings are generated from data that has since changed). If so, the components will be updated accordingly.
7. When the `OutletComponent` is destroyed, all dynamically-loaded components are destroyed as well.


## Security

One of the goals of this library was to make it **safe to use even with potentially unsafe input**, such as user-generated content. It is also designed to grant developers maximum control over which components are allowed to be loaded, and how. It uses the following techniques to achieve this:

Most notably, it uses Angular's `DOMSanitizer` by default to remove all unsafe HTML, CSS and JS in the content string that is not part of a hook. Though not recommended, you may turn this setting off in the [OutletOptions]({{ "documentation/v2/configuration#outletoptions" | relative_url }}). You will then have to ensure yourself that the rendered content does not include <a href="https://en.wikipedia.org/wiki/Cross-site_scripting" target="_blank">Cross Site Scripting attacks (XSS)</a> or other malicious code, however.

Excluded from being checked by the `DOMSanitizer` are the component hooks themselves (as it may remove them depending on their pattern). It is therefore the hook parser's responsibility to ensure that whatever malicious code there may be in the hook is not somehow transferred to the rendered component. For this reason, the standard `SelectorHookParser` that comes with this library does not rely on JavaScript's dangerous `eval()` function to evaluate inputs and outputs and instead internally uses `JSON.parse()` to safely turn strings into variables. Ensure that when writing custom parsers for hooks that take their inputs/outputs directly from the text, similar security precautions are taken!

In addition to this, the scope of code that is accessible by the author of the content string is limited to the [context object]({{ "documentation/v2/features" | relative_url }}), which you can customize to your liking. 

Finally, which components/hooks can be used by the author can be [freely adjusted]({{ "documentation/v2/configuration" | relative_url }}) for each `OutletComponent`, as can their allowed inputs/outputs.

## Caveats

1. As this library does not parse the content string as an actual Angular template, template syntax such as `*ngIf`, `*ngFor`, attribute bindings `[style.width]="'100px'"`, interpolation `{{ someVar }}` etc. will **not** work! This functionality is not planned to be added either, as it would require a fundamentally different approach by relying on the JiT template compiler (which this library intentionally doesn't) or even creating a custom Angular template parser.
2. Hooks can only load components, not directives. There's no way to dynamically create directives as far as i'm aware. If you want to load a directive into the content string, try loading a component that contains that directive instead.
3. Accessing `@ContentChildren` does not work in dynamically-loaded components, as these have to be known at compile-time. However, you can still access them via [onDynamicMount()]({{ "documentation/v2/features#lifecycle-methods" | relative_url }}).

## Comparison with similar libraries

### <a href="https://angular.io/guide/elements" target="_blank">Angular elements</a>

Angular elements allows you to register custom HTML elements (like component selector elements) with the browser itself that automatically load and host an Angular component when they appear anywhere in the DOM (see <a href="https://developer.mozilla.org/en-US/docs/Web/Web_Components" target="_blank">Web components</a>) - even outside of the Angular app. For that reason, these elements work in dynamic content as well and may satisfy your needs.

However, there are a number of advantages this library offers compared to Angular elements:

* **Pattern flexibility:** You are not limited to load components by their selector HTML tags. A hook can have any form and doesn't have to be an HTML element at all. You can automatically replace anything you want with a component (see ["emoji" example]({{ "documentation/v2/parsers#example-1-emoji-parser-singletag" | relative_url }}) or ["link" example]({{ "documentation/v2/parsers#example-2-internal-link-parser-enclosing" | relative_url }})).
* **Scope:** When using Angular elements, web components will automatically load from anywhere in the DOM as they are globally registered with the browser. With this library, you can to specify on each `OutletComponent` individually which exact components to look for.
* **Communication:** In Angular elements, there is no direct line of communication between the parent component rendering the dynamic content and dynamic components loaded as children (such as the [context object]({{ "documentation/v2/features" | relative_url }}) from this library). You will have to fallback on services to transfer data.
* **Bindings:** Though Angular elements allows passing static inputs as HTML attributes to components, it doesn't parse them. This means that all inputs are strings by default and you will have to manually turn them into booleans, arrays, objects etc. yourself. This library parses them automatically for you, much like a normal Angular template - in addition to accepting actual variables from the context object as well.
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
There are also multiple libraries out there that render full Angular templates dynamically and rely on the JiT-compiler to do so. Many of them do not offer support for AoT-compilation (which Ivy uses by default). While it is <a href="https://github.com/angular/angular/issues/20156#issuecomment-468686933" target="_blank">technically possible</a> to load the JiT-compiler during runtime in AoT-mode, it is quite hacky and may break without warning. 

Also, note that rendering a dynamic template as though it were a static file is dangerous if you do not fully control the content, as all Angular components, directives or template syntax expressions are blindly executed just like in a static template. 

Runtime compilation also also suffers from most of the same drawbacks as the other libraries listed here, such as the lack of flexbility and control etc., so I won't list them seperately here.