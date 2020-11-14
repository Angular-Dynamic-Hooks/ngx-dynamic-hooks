# Changelog
All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/MTobisch/ngx-dynamic-hooks/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/MTobisch/ngx-dynamic-hooks/releases/tag/v1.0.0