---
---

# Introduction

<div class="badges" markdown="1">
  [![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/MTobisch/ngx-dynamic-hooks/ci-test.yml?style=flat-square&logo=github&label=CI%20tests)](https://github.com/MTobisch/ngx-dynamic-hooks/actions/workflows/ci-test.yml)
  [![Coverage](https://img.shields.io/codecov/c/gh/MTobisch/ngx-dynamic-hooks?style=flat-square)](https://codecov.io/gh/MTobisch/ngx-dynamic-hooks)
  [![NPM](https://img.shields.io/npm/v/ngx-dynamic-hooks?color=orange&style=flat-square)](https://www.npmjs.com/package/ngx-dynamic-hooks)
  [![License](https://img.shields.io/github/license/mtobisch/ngx-dynamic-hooks?color=blue&style=flat-square)](https://github.com/MTobisch/ngx-dynamic-hooks/blob/master/LICENSE.md)
</div>

With ngx-dynamic-hooks, you can load fully-functional Angular components from string variables - based on their selector (as in normal templates) or **any pattern of your choice**.

![ngx-dynamic-hooks-optimize](https://github.com/MTobisch/ngx-dynamic-hooks/assets/12670925/331b830b-0f98-4c64-917a-9e1b9cf63f22)

## Installation
Simply install via npm 

```sh
npm install ngx-dynamic-hooks --save
```

or yarn

```sh
yarn add ngx-dynamic-hooks
```

## Compatibility

| Angular | Version | JiT | AoT | Ivy | NPM |
| --- | --- | --- | --- | --- | --- |
| 6 - 12  | 1.x.x | yes | yes | yes | `ngx-dynamic-hooks@^1` |
| 13 - 16  | 2.x.x | - | yes | yes | `ngx-dynamic-hooks@^2` |
| 17+  | 3.x.x | - | yes | yes | `ngx-dynamic-hooks@^3` |

The library is compatible with both the older template engine (view engine) as well as Ivy. It **does not** rely on a runtime compiler and therefore works in both JiT- and AoT-modes. Feel free to use whichever you like.
