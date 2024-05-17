
## 5. Features

### 5.1 Context & Dependency Injection:
Often, you may want to communicate with the dynamically-loaded components or pass data to them from the rest of the app. To do so, you have two options:

1. **The context object**
2. **Dependency injection**

The latter works just like in any other component. Simply [inject your services into the component constructor](https://angular.io/guide/dependency-injection) and you're good to go. However, this approach may seem like overkill at times, when you just want to pass in a variable from the parent component into the dynamically-loaded component, perhaps as an input. This is where the context object comes into play.

The context object acts as a bridge between the parent component holding the `OutletComponent` and all dynamically loaded components within. Imagine a context object like:

```ts
const contextObj = {name: 'Kenobi'};
```

You can provide it to the `OutletComponent` as an optional input:

```html
<ngx-dynamic-hooks [content]="..." [context]="contextObj"></ngx-dynamic-hooks>
```

And then use the `context`-keyword to use its data in selector hooks:

```html
'...some dynamic content... <app-jedi [name]="context.name"></app-jedi> ...more dynamic content...'
```

The context object is typically a simple object literal that provides some values of interest from the parent component, but it can technically be anything - even the parent component itself. You can also use alternative notations to access its properties like `context['name']`, call functions like `context.someFunc()` and even use nested expressions like `context[context.someProp].someFunc(context.someParam)`.

**Note:** The context object is the only piece of live code that can accessed from within the content string. No variables or functions, global or otherwise, can be used besides it. This is an intentional security measure. Simply put whatever you want to make available to the author of the text into the context object.

![Communication flow](https://i.imgur.com/K63SQGU.jpg)

### 5.2 Inputs:
You can pass data of almost any type to @Inputs() in selector hooks, such as:

| Type | Example |
| --- | --- | 
| strings  | `[inputName]="'Hello!'"` |
| numbers | `[inputName]="123"` |
| booleans | `[inputName]="true"` |
| null/undefined | `[inputName]="null"` |
| arrays | `[inputName]="['an', 'array', 'of', 'strings']"` |
| object literals | `[inputName]="{planet: 'Tatooine', population: 200000}"` |
| context variables (see [previous point](#51-context--dependency-injection)) | `[inputName]="context.someProp"` |

The inputs are automatically set in the dynamic component and will trigger `ngOnChanges()`/`ngOnInit()` normally.

If using []-brackets, the inputs will be safely parsed into their corresponding variable data type. Because of this, take care to write them code-like, as if this was a TS/JS-file (e.g. don't forget put quotes around strings **in addition** to the quotes of the input property binding).

Alternatively, you may also write inputs without []-brackets as normal HTML-attributes, in which case they won't be parsed at all and will simply be considered strings.

### 5.3 Outputs:
You can subscribe to @Output() events from selector hooks with functions from the context object like:

```html
'...some dynamic content... <app-jedi (wasDefeated)="context.goIntoExile($event)"></app-jedi> ...more dynamic content...'
```
As with normal Angular @Output() bindings, the special `$event`-keyword can optionally be used to pass the emitted event object as a parameter to the function.

#### A note about `this`:
A function directly assigned to the context object will have `this` pointing to the context object itself when called, as per standard JavaScript behaviour. This may be undesired when you would rather have `this` point to original parent object of the function. Two ways to achieve that: 

* Assign the parent of the function to the context object (instead of the function itself) and call via `context.parent.func()`
* If you don't want to expose the parent, assign a [bound function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) to the context object like `const contextObj = {func: this.func.bind(this)}`.

### 5.4 Content projection:
Hooks can be nested without limitations. The loaded components will correctly be rendered in each others `<ng-content>`-slots. When using selector hooks, it will look and work identical as in normal Angular templates:
```html
'...some dynamic content... 
<app-parent>
    <app-content-child></app-content-child>
</app-parent>
...more dynamic content...'
```

There are two small caveats, however: 
1. Parent components cannot use `@ContentChildren()` to get a list of all of the nested components in the content string, as these have to be known at compile time. However, you can still access them via `onDynamicMount()` (see [Lifecycle methods](#55-lifecycle-methods)). 
2. Multiple named `<ng-content>` outlets are currently not supported in component selector hooks. 

### 5.5 Lifecycle methods:
All of Angular's lifecycle methods work normally in dynamically-loaded components. In addition, this library introduces two new lifecycle methods that you can optionally implement: 

* `onDynamicMount()` is called once as soon as **all** dynamic components have rendered (including [lazy-loaded ones](#65-lazy-loading-components)). It is given an `OnDynamicData`-object as its parameter, containing the context object as well as the content children of the component.
* `onDynamicChanges()` is called any time one of these two change. It is also given an `OnDynamicData`-object that will only contain the changed value. The method is therefore called:
    1. Immediately when the component is created (`OnDynamicData` will contain the context object, if not undefined)
    2. Once all components have loaded (`OnDynamicData` will contain the content children)
    3. Any time that context changes by reference (`OnDynamicData` will contain the new context object)

You can implement them like so:
```ts
import { OnDynamicMount, OnDynamicChanges, OnDynamicData, DynamicContentChild } from 'ngx-dynamic-hooks';

export class DynamicComponent implements OnDynamicMount, OnDynamicChanges {

  onDynamicMount(data: OnDynamicData): void {
    // Contains the context object and the content children
    const context = data.context;
    const contentChildren: DynamicContentChild[] = data.contentChildren;
  }

  onDynamicChanges(data: OnDynamicData): void {
    // Contains whichever changed
    if (data.hasOwnProperty('context')) {
      const context = data.context;
    }
    if (data.hasOwnProperty('contentChildren')) {
      const contentChildren: DynamicContentChild[] = data.contentChildren;
    }
  }
}
```

**Note:** You may have spotted that content children are given as `DynamicContentChild`-arrays. Each `DynamicContentChild` consists of the `ComponentRef`, the selector and the `HookValue` of the component, as well as all of its own content children, again given as a `DynamicContentChild` array. It is therefore a hierarchical list of all content children, not a flat one.

**Also:** As normal, make sure to still include an `<ng-content>` block in each parent component so Angular knows where to render the child content.

### 5.6 Change detection:
Dynamically-loaded components are connected to Angular change detection and will be checked when it is triggered like any other part of the app. Setting `ChangeDetectionStrategy.OnPush` on them to limit change detection will work as well. 

The input and output bindings you assign to hooks are checked and updated on every change detection run, which mirrors Angular's default behaviour. This way, if you bind a context property to an input and that property changes, the corresponding component will automatically be updated with the new value for the input and trigger ` ngOnChanges()`. Alternatively, you can also set the option `updateOnPushOnly` to `true` to only update the bindings when the context object changes by reference (see [OutletOptions](#64-outletoptions)).