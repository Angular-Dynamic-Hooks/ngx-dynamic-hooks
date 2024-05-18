---
---

# ngx-dynamic-hooks

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/MTobisch/ngx-dynamic-hooks/ci-test.yml?style=flat-square&logo=github&label=CI%20tests)](https://github.com/MTobisch/ngx-dynamic-hooks/actions/workflows/ci-test.yml)
[![Coverage](https://img.shields.io/codecov/c/gh/MTobisch/ngx-dynamic-hooks?style=flat-square)](https://codecov.io/gh/MTobisch/ngx-dynamic-hooks)
[![NPM](https://img.shields.io/npm/v/ngx-dynamic-hooks?color=orange&style=flat-square)](https://www.npmjs.com/package/ngx-dynamic-hooks)
[![License](https://img.shields.io/github/license/mtobisch/ngx-dynamic-hooks?color=blue&style=flat-square)](https://github.com/MTobisch/ngx-dynamic-hooks/blob/master/LICENSE.md)

Automatically insert live Angular components into dynamic strings (based on their selector or **any pattern of your choice**) and render the result in the DOM.

![ngx-dynamic-hooks-optimize](https://github.com/MTobisch/ngx-dynamic-hooks/assets/12670925/331b830b-0f98-4c64-917a-9e1b9cf63f22)

## 1. Installation
Simply install via npm 

```sh
npm install ngx-dynamic-hooks --save
```

or yarn

```sh
yarn add ngx-dynamic-hooks
```

## 2. Compatibility

| Angular | Version | JiT | AoT | Ivy | NPM |
| --- | --- | --- | --- | --- | --- |
| 6 - 12  | 1.x.x | yes | yes | yes | `ngx-dynamic-hooks@^1` |
| 13+  | 2.x.x | - | yes | yes | `ngx-dynamic-hooks@^2` |

The library is compatible with both the older template engine (view engine) as well as Ivy. As it does not rely on a runtime compiler, it also works in both JiT- and AoT-environments.

## Table of contents
1. [Installation](#1-installation)
2. [Compatibility](#2-compatibility)
3. [What it does](./what-it-does.md)
4. [Quick start](./quickstart.md)
5. [Features](./features.md)
    * [5.1 Context & Dependency Injection](#51-context--dependency-injection)
    * [5.2 Inputs ](#52-inputs)
    * [5.3 Outputs](#53-outputs)
    * [5.4 Content projection](#54-content-projection)
    * [5.5 Lifecycle methods](#55-lifecycle-methods)
    * [5.6 Change detection](#56-change-detection)
6. [Configuration](./configuration.md)
    * [6.1 Global settings](#61-global-settings)
    * [6.2 Outlet component bindings](#62-outlet-component-bindings)
    * [6.3 `HookParserEntry`](#63-hookparserentry)
    * [6.4 `OutletOptions`](#64-outletoptions)
    * [6.5 Child modules (forChild)](#65-child-modules-forchild)
    * [6.6 Lazy-loading components](#66-lazy-loading-components)
7. [Writing your own HookParser](#7-writing-your-own-hookparser)
    * [7.1 What makes a parser](#71-what-makes-a-parser)
    * [7.2 Example: Emoji parser (standalone)](#72-example-emoji-parser-standalone)
    * [7.3 Example: Internal link parser (enclosing)](#73-example-internal-link-parser-enclosing)
8. [Advanced notes](#8-advanced-notes)
    * [8.1 Programmatic usage (without component)](#81-programmatic-usage-without-component)
    * [8.2 Non-browser Platforms implemention](#82-non-browser-platforms-implemention)
9. [Trivia](#9-trivia)
    * [9.1 How it works](#91-how-it-works)
    * [9.2 Security](#92-security)
    * [9.3 Caveats](#93-caveats)
    * [9.4 Comparison with similar libraries](#94-comparison-with-similar-libraries)
10. [Troubleshooting](#10-troubleshooting)
11. [Special thanks](#11-special-thanks)