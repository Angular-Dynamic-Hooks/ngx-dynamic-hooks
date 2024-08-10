---
---

# Single component

While you can always load just one component with the `DynamicHooksComponent`, sometimes that can feel a bit verbose and it would be more convenient to have a dedicated tool for the job.

For that purpose, you can simply use the `DynamicSingleComponent`. It loads a single dynamic component with inputs/outputs whereever you need it.

```html
<ngx-dynamic-single
  [component]="compClass"
  [inputs]="yourInputs"
  [outputs]="yourInputs"
  [options]="yourOptions"
  (componentLoaded)="onComponentLoaded(compRef)"
></ngx-dynamic-single>
```

Here are some details about the inputs:

Input name | Type | Description
--- | --- | ---
`component` | Any component class | The component class to load.
`inputs` | Object literal | An object literal where the keys are the input names and the values are their values.
`outputs` | Object literal | An object literal where the keys are the output names and the values are functions that will be called when they emit.
`options` | `DynamicHooksSingleOptions` | A couple of options to modify how the component works.

A `DynamicHooksSingleOptions` object is just an abbreviated version of a [ParseOptions]({{ "documentation/configuration#parseoptions" | relative_url }}) object and works the same:

```ts
interface DynamicHooksSingleOptions {
  updateOnPushOnly?: boolean;
  compareInputsByValue?: boolean;
  compareOutputsByValue?: boolean;
  compareByValueDepth?: number;
  ignoreInputAliases?: boolean;
  ignoreOutputAliases?: boolean;
  acceptInputsForAnyProperty?: boolean;
  acceptOutputsForAnyObservable?: boolean;
}
```

There is also one output you can subscribe to:

Input name | Type | Description
--- | --- | ---
`componentLoaded` | `EventEmitter<ComponentRef>` | Will emit the `ComponentRef` when the component has loaded

The `DynamicSingleComponent` will automatically reload the internal component whenever the `component`-input changes and keep updating it if any other input changes.