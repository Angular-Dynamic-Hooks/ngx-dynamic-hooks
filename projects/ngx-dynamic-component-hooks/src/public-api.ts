/*
 * Public API Surface of ngx-dynamic-component-hooks
 */

// General
export * from './lib/dynamicComponentHooks.m';
export * from './lib/interfacesPublic';
export * from './lib/globalSettings';

// Main component
export * from './lib/components/outlet/outletComponent.c';
export * from './lib/components/outlet/options/options';
export * from './lib/components/outlet/options/parserEntry';

// GenericSelectorParser
export * from './lib/parsers/genericSelector/genericSelectorParser';
export * from './lib/parsers/genericSelector/config/parserConfig';

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

