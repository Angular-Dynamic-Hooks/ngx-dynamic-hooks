# Changelog
All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.8.0] - 2023-03-21
### Added
- Added forChild feature
- Fix: Outputs of dynamic components now still work in onDestroy

## [1.7.6] - 2023-03-23
### Maintenance 
- Fix: No longer de/serializes nested context variables, which caused unserializable objects to be removed

## [1.7.5] - 2023-02-13
### Maintenance
- Fix: Included stack traces when logging some errors
- Fix: Fixed travis.yml node version

## [1.7.3+4] - 2022-05-23
### Maintenance
- Fix: Dynamically-created components now use the nearest injector by default, not the root injector. This prevents routing bugs related to components being passed the wrong ActivatedRoute.

## [1.7.2] - 2021-11-06
### Maintenance
- Update to Angular 13
- Updated readme

## [1.7.1] - 2021-07-07
### Maintenance
- Fixed bug so that bracketless inputs with empty values now return empty strings instead of undefined

## [1.7.0] - 2021-06-01
### Added
- Introduced PlatformService which serves as an abstraction layer for DOM manipulation. By defining custom PlatformServices, users can now use the library on other platforms than the browser as well.

## [1.6.0] - 2021-05-19
### Maintenance
- Update to Angular 12
- Updated readme

## [1.5.1] - 2021-03-08
### Maintenance
- Input/Output names on selector hooks can now include hyphens (-)

## [1.5.0] - 2021-02-02
### Maintenance
- Improved component host element creation logic to fix a bug of child components not loading when they are not immediately part of the DOM (through *ngIf, for example). Due to this, lazily-loaded components are now wrapped in anchor elements.

## [1.4.1] - 2020-12-30
### Maintenance
- Improved compatibility with IE11 and older versions of JavaScript

## [1.4.0] - 2020-11-14
### Maintenance
- Update to Angular 11
- Updated readme

## [1.3.0] - 2020-11-03
### Added
- Introduced OutletService, which can be used to parse a content string programmatically, skipping the use of the OutletComponent.

## [1.2.1] - 2020-09-23
### Added
- Input/Output names for selector hooks can now contain numbers as well as the _ and $ characters (as long as the number is not the first character, which would be an invalid JavaScript variable name).

## [1.2.0] - 2020-09-23
### Added
- Inputs can now also be passed to dynamic components without []-brackets as normal HTML attributes, in which case they will be considered strings.

## [1.1.0] - 2020-08-26
### Added
- More tests of baseline functionality

### Changed
- The "componentsLoaded"-output of the OutletComponent now returns a more useful LoadedComponent-array instead of just true.
- The hook indexes now start from 1 instead of from 0

## [1.0.0] - 2020-08-26
### Added
- This was the initial release, so everything was added here, really.

[Unreleased]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.8.0...HEAD
[1.8.0]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.7.6...v1.8.0
[1.7.6]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.7.5...v1.7.6
[1.7.5]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.7.4...v1.7.5
[1.7.3+4]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.7.2...v1.7.4
[1.7.2]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.4.1...v1.5.0
[1.4.1]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/MTobisch/ngx-dynamic-hooks/releases/tag/v1.0.0