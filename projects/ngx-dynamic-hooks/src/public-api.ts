/*
 * Public API Surface of ngx-dynamic-hooks
 */

// General
export * from './lib/dynamicHooks.m';
export * from './lib/interfacesPublic';
export * from './lib/globalSettings';

// Main component
export * from './lib/components/outlet/outletComponent.c';
export * from './lib/components/outlet/options/options';
export * from './lib/components/outlet/options/parserEntry';
export * from './lib/components/outlet/services/outletService';

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

// Testing
// export * from './tests/testing-api';

