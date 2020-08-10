import { ComponentRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { HookParser, HookValue, HookComponentData, HookBindings } from './interfacesPublic';
import { DetailedStringifyResult } from './utils/deepComparer';

// Hook interfaces
// ---------------------------------

/**
 * A list of Hooks
 */
export interface HookIndex {
    [key: string]: Hook;
}

/**
 * The main state object for a single Hook, containing all of its information and data
 */
export interface Hook {
    id: number;
    parser: HookParser;
    value: HookValue;
    data: HookComponentData;
    componentRef: ComponentRef<any>;
    bindings: HookBindings;
    previousBindings: PreviousHookBindings;
    dirtyInputs: Set<string>;
    outputSubscriptions: {[key: string]: Subscription};
}

/**
 * The previous bindings of a Hook
 */
export interface PreviousHookBindings {
    inputs: {[key: string]: PreviousHookBinding};
    outputs: {[key: string]: PreviousHookBinding};
}
export interface PreviousHookBinding {
    reference: any;
    stringified: DetailedStringifyResult;
}

// GenericSelectorParser interfaces
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
