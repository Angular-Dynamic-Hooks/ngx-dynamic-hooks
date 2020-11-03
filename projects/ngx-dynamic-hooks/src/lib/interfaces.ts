// SelectorHookParser interfaces
// ---------------------------------

/**
 * A detailed information object for a single binding, containing the raw unparsed binding,
 * its parsed value and all used context variables, if any
 */
export interface RichBindingData {
    raw: string;
    value: any;
    boundContextVariables: {[key: string]: any};
}
