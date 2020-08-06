import { ComponentRef, Injector, InjectionToken } from '@angular/core';
import { Subscription } from 'rxjs';
import { HookParser, HookValue, HookData, HookBindings } from './interfacesPublic';

// Hook interfaces
// ---------------------------------

export interface HookIndex {
    [key: string]: Hook;
}

export interface Hook {
    id: number;
    parser: HookParser;
    value: HookValue;
    data: HookData;
    componentRef: ComponentRef<any>;
    bindings: HookBindings;
    previousBindings: PreviousHookBindings;
    dirtyInputs: Set<string>;
    outputSubscriptions: {[key: string]: Subscription};
}

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

export interface RichBindingData {
    raw: string;
    value: any;
    boundContextVariables: {[key: string]: any};
}

// Other
// ---------------------------------

export interface DetailedStringifyResult {
    result: string;
    compareDepthReachedCount: number;
}
