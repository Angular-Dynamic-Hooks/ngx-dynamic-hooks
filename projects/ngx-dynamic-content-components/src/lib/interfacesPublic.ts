import { ComponentRef, Injector, InjectionToken } from '@angular/core';
import { Subscription } from 'rxjs';

// Parser
// --------------------------------------------

/**
 * The baseline properties that each parser must have
 */
export interface HookParser {
    name?: string;
    findHooks(text: string, context: {[key: string]: any}): Array<HookPosition>;
    loadHook(hookId: number, hookValue: HookValue, context: {[key: string]: any}, childNodes: Array<Element>): HookData;
    updateBindings(hookId: number, hookValue: HookValue, context: {[key: string]: any}): HookBindings;
}


// Hook interfaces relevant for parsers
// --------------------------------------------

export interface HookPosition {
    openingTagStartIndex: number;
    openingTagEndIndex: number;
    closingTagStartIndex?: number;
    closingTagEndIndex?: number;
}

export interface HookValue {
    openingTag: string;
    closingTag: string;
}

export interface HookData {
    component: ComponentConfig;
    injector?: Injector;
    content?: Array<Array<Element>>;     // Can be used to optionally overwrite the actual child nodes as projected content
}

export type ComponentConfig = (new(...args: any[]) => any) | LazyLoadComponentConfig;

export interface LazyLoadComponentConfig {
    importPromise: () => Promise<any>;
    importName: string;
}

export interface HookBindings {
    inputs?: {[key: string]: any};
    outputs?: {[key: string]: (event: any, context: any) => any};
}


// Class interfaces
// ---------------------------------

export interface OnDynamicMount {
    onDynamicMount(data: OnDynamicData): void;
}

export interface OnDynamicChanges {
    onDynamicChanges(data: OnDynamicData): void;
}

export interface OnDynamicData {
    context?: any;
    contentChildren?: Array<DynamicContentChildren>;
}

export interface DynamicContentChildren {
    componentRef: ComponentRef<any>;
    componentSelector: string;
    contentChildren: Array<DynamicContentChildren>;
    hookValue: HookValue;
}