---
---

## 10. Troubleshooting
**Some of my elements/attributes are not rendering!**

This might be due to sanitization. This library uses Angular's native DomSanitizer to remove potentially malicious code like `<script>`-tags from the content. To ensure maximum security, the sanitizer is fairly aggressive, however, and will also remove seemingly harmless elements, like `<input>` or attributes like `id`.

You can turn off sanitization at any time through the [`OutletOptions`](#64-outletoptions). Note that you will then have to ensure that the content is safe to render by yourself!

**Escaped HTML entities such as `&gt;` and `&lt;` are transformed back to their actual characters (`<` and `>`) in the content string. This is not desired behaviour.**

Automatically transforming HTML entities is a convenience feature to ensure maximum compatibility when parsing hooks. You can turn it off at any time via the `convertHTMLEntities`-setting in the [`OutletOptions`](#64-outletoptions).

**I'm getting the error "`<ngx-dynamic-hooks>` is not a known element" in my templates**

Some editors like VS Code don't always immediately catch on to the newly available components when a module has been imported. Try restarting the editor to see if that helps (it should compile fine, though). If not, check that you have correctly imported the `DynamicHooksModule` into you main module as shown in the [Quick start](#4-quick-start)-section to make everything available.

**I'm getting the error "Data type for following input was not recognized and could not be parsed"**

You most likely have a typo in the input. If its a string, remember to put quotation marks around it ('', "" or ``). If that isn't it, it may help to copy the input into an IDE that is set to JS/TS syntax and have it highlight potential typos for you.

**In my output function, `this` does not point to the parent object of the function**

See the [Outputs-section](#53-outputs) for a solution to this problem.

**The globalParsersBlacklist/whitelist inputs for the `OutletComponent` don't work**

Make sure you have explicitly given the parsers a name (see the [HookParserEntry](#63-hookparserentry)-section on how to do so) that correlates with the black/whitelisted name.

**I'm writing a custom parser. When implementing `loadComponent()`, why are there `<dynamic-component-placeholder>`-elements in the passed `childNodes`?**

At this point in the workflow, the original hooks have already been replaced with the placeholder-elements you see in the `childNodes`. These placeholders are later replaced again with the actual Angular components. Note that if you replace the inner content of the hook and modify or remove these placeholders, the corresponding component may not load correctly!

**I've written a custom parser. `ngOnChanges()` keeps triggering in my dynamic components!**

It is important to remember that `getBindings()` is called anytime the current values of the bindings are requested. By default, that is on component creation and on every change detection run afterwards. If this function parses the bindings from scratch and returns new references for them each time it is called, the bindings are considered to have changed and `ngOnChanges()` in the dynamic components will be triggered (or in the case of an output binding, it will be resubscribed). 

You can avoid that by introducing a persistent state in your parsers and by remembering and reusing the previous references if they haven't changed. If you need a way to tell if the bindings are deeply identical by value for this, you can import the `DeepComparer` service from this library and use the `isEqual()` method (or alternatively use Underscore's [isEqual()](http://underscorejs.org/#isEqual) or Lodash's [isEqual()](https://lodash.com/docs/#isEqual)). If you don't want to bother with any of that, you can also simply set the `compareInputsByValue`/`compareOutputsByValue`-options in `OutletOptions` to true (see [OutletOptions](#64-outletoptions)), which does this automatically, though it will then apply to all active parsers.

**I'm getting the error "TypeError: Object(…) is not a function"**

You might be using Rxjs-version that is older than 6, which was introduced with Angular 6. If you are using Angular 5, either upgrade to 6 or try using [Rxjs compat](https://www.npmjs.com/package/rxjs-compat) to fix this issue.