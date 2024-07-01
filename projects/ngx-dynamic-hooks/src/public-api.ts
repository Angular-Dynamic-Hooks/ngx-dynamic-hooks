/*
 * Public API Surface of ngx-dynamic-hooks
 */

// General
export { provideDynamicHooks, provideDynamicHooksForChild, resetDynamicHooks } from './lib/dynamicHooksProviders';
export * from './lib/interfacesPublic';

// Settings
export * from './lib/services/settings/options';
export * from './lib/services/settings/parserEntry';

// Main logic
export * from './lib/components/main/dynamicHooksComponent';
export * from './lib/services/dynamicHooksService';
export * from './lib/services/settings/settings';

// SelectorHookParser
export * from './lib/parsers/selector/string/stringSelectorHookParser';
export * from './lib/parsers/selector/element/elementSelectorHookParser';
export * from './lib/parsers/selector/selectorHookParserConfig';

// Utils
export * from './lib/services/utils/dataTypeParser';
export * from './lib/services/utils/deepComparer';
export * from './lib/services/utils/hookFinder';
export * from './lib/constants/regexes';

// Utils
export * from './lib/services/utils/utils';

// Platform
export * from './lib/services/platform/platformService';
export * from './lib/services/platform/defaultPlatformService';

// Testing
// export * from './tests/testing-api';

