/*
 * Public API Surface of ngx-dynamic-hooks
 */

// General
export * from './lib/dynamicHooks.m';
export * from './lib/interfacesPublic';

// Settings
export * from './lib/components/outlet/settings/options';
export * from './lib/components/outlet/settings/parserEntry';

// Main logic
export * from './lib/components/outlet/outletComponent.c';
export * from './lib/components/outlet/services/outletService';
export * from './lib/components/outlet/settings/settings';

// SelectorHookParser
export * from './lib/parsers/selector/selectorHookParser';
export * from './lib/parsers/selector/config/selectorHookParserConfig';

// Utils
export * from './lib/utils/dataTypeEncoder';
export * from './lib/utils/dataTypeParser';
export * from './lib/utils/deepComparer';
export * from './lib/utils/hookFinder';
export * from './lib/utils/regexes';

// Polyfills
export * from './lib/polyfills/matchAll';

// Platform
export * from './lib/platform/platformService';
export * from './lib/platform/platformBrowserService';

// Testing
// export * from './tests/testing-api';

