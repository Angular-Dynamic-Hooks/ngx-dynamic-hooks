---
---

# Standalone mode

Angular Dynamic Hooks can be used in standalone mode, allowing you to load Angular components into HTML **without an Angular app**.

This is ideal for mounting Angular components as "frontend widgets" onto HTML that can come from anywhere, such as a CMS like Wordpress, a dedicated backend framework like Laravel or even just static HTML pages.

## Getting started

To use standalone mode, simply import the `parseHooks` function from the library and call it with the content, parsers etc. you need. It is the equivalent of [DynamicHooksService.parse]({{ "documentation/v3/general-usage#programmatic-usage-with-service" | relative_url }}), just outside of Angular.  The full signature looks like this:

```ts
const parseHooks = async (
  content: any,
  parsers: HookParserEntry[],
  context: any = null,  
  options: ParseOptions|null = null,
  targetElement: HTMLElement|null = null,
  targetHookIndex: HookIndex = {},
  environmentInjector: EnvironmentInjector|null = null,
): Promise<ParseResult>
```

At its most basic, you really only need to pass the **content** as well as a list of **parsers**. The first example from the [General Usage page]({{ "/documentation/v3/general-usage#starting-out" | relative_url }}) in standalone mode would then look like this:

```ts
import { parseHooks } from 'ngx-dynamic-hooks';
import { ExampleComponent } from 'somewhere';

const content = 'Load a component here: <app-example></app-example>';
const parsers = [ExampleComponent];

parseHooks(content, parsers).then(result => {
  // Do whatever
});
```

Often, you may want to parse the whole page for components. In such cases, you can simply pass `document.body` as content: 

```ts
parseHooks(document.body, parsers)
```

Angular components will then be loaded into all hooks/selectors found anywhere in the browser. For a live example of standalone mode being used, see the Stackblitz embeds further below.

## Adding providers

You can **optionally** specify a list of providers for the loaded components to use, just like in a normal Angular app. For this, import the `createProviders` function:

```ts
const createProviders = (
  providers: Provider[] = [], 
  parentScope?: ProvidersScope
): ProvidersScope
```

This will return a scope that exposes its own internal `parseHooks` method that will make use of the specified providers. A simple example could look like this:

```ts 
import { createProviders } from 'ngx-dynamic-hooks';
import { MyCustomService } from 'somewhere';
import { ExampleComponent } from 'elsewhere';

const scope = createProviders([
  MyCustomService,
  // Other providers...
]);

scope.parseHooks(document.body, [ExampleComponent]).then(result => {
  // Do whatever
});
```

Scopes can also inherit providers from each other:

```ts
const parentScope = createProviders([...]);
const scope = createProviders([...], parentScope);
```

{% include docs/widgets/notice.html content='
  <p><b>Tip</b>: If your service is decorated with <a href="https://angular.dev/guide/di/creating-injectable-service#creating-an-injectable-service" target="_blank"><code>@Injectable(providedIn: "root")</code></a>, you do not even need a scope and the services will be shared naturally.</p>  
' %}

## Building

In terms of writing code, we are already done. In order to compile Angular components however, special build tools are required. This is typically fully handled by the Angular CLI and its `ng build` command.

With standalone mode, we have two options: 

- We can simply also use `ng build` to compile our standalone mode code (recommended).
- If you have a specialized Webpack build pipeline, we can add Angular plugins to Webpack in order to compile our code **without the Angular CLI**.


### a) Building with the CLI

Using the Angular CLI is the recommended method as it is easy and uses the official build tools.

All that is needed is the <a href="https://angular.dev/tools/cli/setup-local" target="_blank">Angular CLI</a>, an **angular.json** file in your project directory and of course Angular itself as a dependency in your package.json file.

**Tip:** As a starting point, you can simply copy the <a href="https://github.com/MTobisch/Angular-Dynamic-Hooks-Example-Standalone-CLI/blob/main/angular.json" target="_blank">angular.json</a> and <a href="https://github.com/MTobisch/Angular-Dynamic-Hooks-Example-Standalone-CLI/blob/main/package.json" target="_blank">package.json</a> files from the Stackblitz example below. Alternatively, you can always just call `ng new` to create a fresh Angular project somewhere and copy `angular.json` and `package.json` from there.

Make sure all dependencies are installed (including **Angular Dynamic Hooks**) and that in `angular.json` under `project.PROJECTNAME.architect.build.options`:

- `browser` points to your main entry point file.
- `output` points to where you want to build it to. 
- `index` points to a <a href="https://github.com/MTobisch/Angular-Dynamic-Hooks-Example-Standalone-CLI/blob/0989271a5593611006687886c5abd53f6f6fd480/src/index.html" target="_blank">minimal index.html file</a> (breaks otherwise).

Then call `ng build` to build the finished JS files!

{% include docs/widgets/notice.html content='
  <span>Live example to be followed!</span>
' %}

{% include docs/widgets/notice.html content='
  <h4>Bundled or separate file?</h4>
  <p>If you have unrelated TS/JS code that should be bundled along with <code>parseHooks</code>, you could simply point <code>ng build</code> to a common entry point file (like <code>main.ts</code>).</p>
  <p>Alternatively, you could compile the <code>parseHooks</code> call separately into its own file and then include that file independently in the browser (via a script tag or otherwise) when you want to load the Angular components - a bit like Angular Elements.</p>
' %}

### b) Building with Webpack

When you have an existing Webpack-based build pipeline and only wish to incorporate loading Angular components into that, it can make sense to incorporate the Angular build tools into Webpack rather than using the CLI. 

**Some special notes:**

- You will have to adjust `webpack.config.js` to support Angular component compilation (see example below for a working config).
- The bundle size will be larger as with a CLI-compiled Angular app, as a manual Webpack config lacks some of the magic the Angular compiler internally uses.
- You will have to import `zone.js` at the top of your entry file.

That said, the rest of the code can be identical as when using the CLI. Here is the same example as before, just with Webpack-compilation this time:

{% include docs/widgets/notice.html content='
  <span>Live example to be followed!</span>
' %}

## Trivia

### React to DOM changes

It is often a good idea to automatically parse the content again when some of its elements change, so the corresponding components are loaded immediately.

For this purpose, you can use the `observeElement` function. It automatically picks up on DOM changes and runs a callback function whenever new elements are added to your content. Here is a simple usage example:

```ts
import { parseHooks, observeElement } from 'ngx-dynamic-hooks';
...

observeElement(document.body, element => {
  parseHooks(element, parsers);
});
```

### Trigger from other scripts

If you want to trigger `parseHooks` manually, but need to do so from another script, using custom browser events for communication is a good solution. For example, add the following to your `parseHooks` script:

```ts
  document.addEventListener('parseHooks', event => {
    parseHooks((event as CustomEvent).detail, parsers)
  });
```

You can then dispatch events from anywhere else in the browser to trigger the listener: 

```ts
  document.dispatchEvent(new CustomEvent('parseHooks', { detail: theContent}));
```

### Forcing service creation

In Angular, services are only constructed when they are requested by a component. This means that if a component does not appear on a hypothetical page of your website, any services that are only injected by that component would also not be created. 

This can be a problem if you have a service that takes care of some global tasks and should always work.

To prevent this from happening, you can use the `APP_INITIALIZER` token provided by Angular. Simply "subscribe" to the the `APP_INITIALIZER` token in the providers given to `createProviders()` and your service will always be constructed when calling `scope.parseHooks`, irrespective if it finds anything.

```ts
  import { APP_INITIALIZER } from '@angular/core';
  ...

  const scope = createProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      multi: true,
      deps: [MyCustomService]
    }
  ]);
```

### About Angular elements

Standalone mode fills a similar role to <a href="https://angular.dev/guide/elements" target="_blank">Angular elements</a>: Loading proper Angular components into framework-agnostic HTML that can come from anywhere. 

However, Angular Dynamic Hooks offers several advantages that go beyond what Angular elements is capable of, such as:

- **Anything can be a hook** - not just custom elements. You can load components into any standard HTML element you want and even replace text with components.
- You can easily **lazy-load** components only when they appear on the page.
- Inputs are automatically parsed into their data types, rather than leaving them as strings.

See the full comparison of this library with Angular Elements [on the Trivia page]({{ 'documentation/v3/trivia#angular-elements' | relative_url }}).