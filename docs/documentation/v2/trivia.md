---
---

## 9. Trivia

### 9.1 How it works:
This library doesn't rely on any special "hacks" to load the dynamic components. Most notably, it uses [ComponentFactory.create()](https://angular.io/api/core/ComponentFactory#create) from Angular's public api, which is safe and has been around since Angular 2.  

It then adds a lot of custom code around this core function to render the components at exactly the right place, register inputs and outputs, project the content properly, activate change detection, update and destroy them automatically, etc. - all to integrate the dynamic components into Angular as naturally as possible. If you are curious about the inner workings of the library, here's a short description:

1. A content string is passed as @Input() to the `OutletComponent` and an array of parsers is retrieved either as another @Input() or from the global settings.
2. The `findHooks()`-method of all registered parsers is called and (with the help of the returned `HookPosition[]`) all found hooks are replaced with component element placeholders.
3. The content string is then parsed by the native browser HTML parser to create a DOM tree, which is then inserted as the innerHTML of the `OutletComponent`.
4. For each found hook, the `loadComponent()`-method of its parser is called to get the component class. This component is then dynamically loaded into the previously created placeholder elements (now existing as actual DOM nodes) as fully-functional Angular components via `ComponentFactory.create()`.
5. For each created component, the `getBindings()`-method of its parser is called and the returned inputs/outputs passed to and subscribed with the component.
6. On future update requests (by default, on every change detection run), `getBindings()` is called again to see if it returns different values than before (for example, if the bindings are generated from data that has since changed). If so, the components will be updated accordingly.
7. When the `OutletComponent` is destroyed, all dynamically-loaded components are destroyed as well.


### 9.2 Security:
One of the goals of this library was to make it **safe to use even with potentially unsafe input**, such as user-generated content. It is also designed to grant developers maximum control over which components are allowed to be loaded, and how. It uses the following techniques to achieve this:

Most notably, it uses Angular's `DOMSanitizer` by default to remove all unsafe HTML, CSS and JS in the content string that is not part of a hook. Though not recommended, you may turn this setting off in the [OutletOptions](#64-outletoptions). You will then have to ensure yourself that the rendered content does not include [Cross Site Scripting attacks (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) or other malicious code, however.

As mentioned, the `DOMSanitizer` does not actually sanitize the hooks themselves (as it may remove them depending on their pattern). This is not an issue as the hooks are replaced by components anyway and never actually rendered. Only the corresponding `HookParser` sees the hook in its original form in order to analyze it. It is therefore the parser's responsibility to ensure that whatever malicious code there may be in the hook is not somehow transferred to the rendered component. For this reason, the standard `SelectorHookParser` that comes with this library does not rely on JavaScript's dangerous `eval()` function to evaluate inputs and outputs and instead internally uses `JSON.parse()` to safely turn strings into variables. **Note:** When writing custom parsers for hooks that take their inputs/outputs directly from the text, make sure to take similar security precautions!

In addition to this, the scope of code that is accessible by the author of the content string is limited to the [context object](#51-context--dependency-injection), which you can customize to your liking. 

Finally, which components/hooks can be used by the author can be [freely adjusted](#63-hookparserentry) for each `OutletComponent`, as can their allowed inputs/outputs.

### 9.3 Caveats:
1. As this library does not parse the content string as an actual Angular template, template syntax such as `*ngIf`, `*ngFor`, attribute bindings `[style.width]="'100px'"`, interpolation `{{ someVar }}` etc. will **not** work! This functionality is not planned to be added either, as it would require a fundamentally different approach by relying on the JiT template compiler (which this library intentionally doesn't). This would break flexibility and all existing security features.
2. Hooks can only load components, not directives. There's no way to dynamically create directives as far as i'm aware. If you want to load a directive into the content string, try loading a component that contains that directive instead.
3. `@ContentChildren` don't work in dynamically-loaded components, as these have to be known at compile-time. However, you can still access them via [onDynamicMount()](#55-lifecycle-methods).

### 9.4 Comparison with similar libraries:
#### [Angular elements](https://angular.io/guide/elements)
Angular elements allows you to register custom HTML elements (like component selector elements) with the browser itself that automatically load and host an Angular component when they appear anywhere in the DOM (see [Web components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)) - even outside of the Angular app. For that reason, these elements work in dynamic content as well and may satisfy your needs.

However, there are a number of advantages this library offers compared to Angular elements:

* **Hook pattern flexibility:** You are not limited to load components by their selector HTML tags. A hook can have any form and doesn't have to be an HTML element at all. You can automatically replace anything you want with a component, which opens up many possibilities for user-generated content (see [Emoji-example](#72-example-emoji-parser-standalone)) or your own posts (see [Internal links example](#73-example-internal-link-parser-enclosing)).
* **Control:** With Angular elements, you have no say in where the components are allowed be loaded. Web components will automatically load anywhere in- or outside your app as they are globally registered with the browser. With this library however, you can to specify for each `OutletComponent` individually which hooks to use, what components to load for them and which inputs/outputs to give them.
* **Context:** In Angular elements, there is no direct line of communication with the component hosting the dynamic content, such as the [context object](#51-context--dependency-injection) from this library. You will have to fallback on services to transfer data.
* **Bindings:** Though Angular elements allows passing static inputs as HTML attributes to components, it doesn't parse them. This means that all inputs are strings by default and you will have to manually turn them into booleans, arrays, objects etc. yourself. This library parses them automatically for you, much like a normal Angular template - in addition to accepting actual variables from the context object as well.
* **Projected content:** Angular elements doesn't normally render projected content in the component's `<ng-content>`. There is a workaround involving `<slot>`, but its not ideal. This library renders `<ng-content>` normally.

#### [Ng-Dynamic](https://github.com/lacolaco/ng-dynamic)
This library was one of the inspirations for Ngx-Dynamic-Hooks and is unfortunately not maintained anymore. It consited of two parts, but I'll just focus on its `<dynamic-html>`-component, which worked like a simpler version of this library. In short, it looked for a component selector in a content string and simply replaced it with the corresponding component, also using `ComponentFactory.create()`. As that is pretty much all it focused on, it:

* required selector elements to load components (hooks can be anything)
* provided no direct line of communication to the parent component like the context object
* did not automatically handle inputs/outputs in any way
* did not automatically handle projected content in any way
* had no security features whatsoever
* could not be customized through options

Simply think of ngx-dynamic-hooks as a library that picks up the torch from ng-dynamic's `<dynamic-html>`-component and takes it further.

#### Runtime compilation,  [Ngx-Dynamic-Template](https://github.com/apoterenko/ngx-dynamic-template), etc.
There are also multiple libraries out there that render full Angular templates dynamically and rely on the JiT-compiler to do so. Many of them do not offer support for AoT-compilation (which Ivy uses by default). While it is [technically possible](https://indepth.dev/posts/1054/here-is-what-you-need-to-know-about-dynamic-components-in-angular) to load the JiT-compiler during runtime in AoT-mode, this approach uses the low-level API of Angular and as such may break without warning in the future. 

Also, note that rendering a dynamic template as though it were a static file is dangerous if you do not fully control the content, as all Angular components, directives or template syntax expressions are blindly executed just like in a static template. 

Runtime compilation also also suffers from most of the same drawbacks as the other libraries listed here, such as the lack of flexbility and control etc., so I won't list them seperately here.