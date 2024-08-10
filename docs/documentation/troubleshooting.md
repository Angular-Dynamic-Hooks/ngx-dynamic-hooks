---
---

# Troubleshooting

### **Some of my elements/attributes are not rendering!**

This might be due to sanitization. This library uses Angular's native `DomSanitizer` to remove potentially malicious code like `<script>`-tags from the content. To ensure maximum security, the sanitizer is fairly aggressive and will also remove seemingly harmless elements, like `<input>` or attributes like `id`.

You can turn off sanitization at any time through the [ParseOptions]({{ "documentation/configuration#parseoptions" | relative_url }}). Note that you will then have to ensure that the content is safe to render yourself!

### **Error: `ngx-dynamic-hooks` is not a known element**

It might be that you have not imported the `DynamicHooksComponent` into the `imports` field of either your component (if using standalone components) or module.

### **Error: Data type for following input was not recognized and could not be parsed**

You most likely have a typo in the input. If its a string, remember to put quotation marks around it ('', "" or ``). If that isn't it, it may help to copy the input into an IDE that is set to JS/TS syntax and have it highlight potential typos for you.

### **In my output function, `this` does not point to the parent object of the function**

See the [Outputs-section]({{ "documentation/component-features#outputs" | relative_url }}) for a solution to this problem.

### **globalParsersBlacklist/whitelist for the `DynamicHooksComponent` doesn't work**

Make sure you have explicitly given the parsers a name (see the [Parsers]({{ "documentation/parsers" | relative_url }})-section on how to do so) that correlates with the black/whitelisted name.

### **I've written a custom parser. `ngOnChanges()` keeps triggering**

It is important to remember that `getBindings()` on hook parsers is called anytime the current values of the bindings are requested. By default, that is on component creation and on every change detection run afterwards. If this function parses the bindings from scratch and returns new references for them each time it is called, the bindings are considered to have changed and `ngOnChanges()` in the dynamic components will be triggered (or in the case of an output binding, it will be resubscribed). 

You can avoid that by storing and reusing the previous references if they haven't changed. 

If you need a way to tell if the bindings are deeply identical by value for this, you can import the `Deep Comparer` service from this library and use the `isEqual()` method (or alternatively use Underscore's <a href="https://underscorejs.org/#isEqual" target="_blank">isEqual()</a> or Lodash's <a href="https://lodash.com/docs/#isEqual" target="_blank">isEqual()</a>.

If you don't want to bother with any of that, you can also simply set the `compareInputsByValue`/`compareOutputsByValue`-options in [ParseOptions]({{ "documentation/configuration#parseoptions" | relative_url }}) to true, which does this automatically, though it will then apply to all active parsers.