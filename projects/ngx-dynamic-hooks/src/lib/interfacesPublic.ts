import { ComponentRef, Injector } from '@angular/core';
import { OutletOptions } from '../tests/testing-api';
import { Subscription } from 'rxjs';
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

// Parser
// --------------------------------------------

/**
 * The baseline properties that each parser must have
 */
export interface HookParser {
    /**
     * The name of the parser (used for black/whitelists)
     */
    name?: string;

    /**
     * Returns the positions of all hooks in the content string.
     *
     * This function is called once for each parser.
     *
     * @param content - The content to search for hooks
     * @param context - The current context object
     */
    findHooks(content: string, context: any): HookPosition[];

    /**
     * How to instantiate the component for this hook.
     *
     * This function is called once for each hook.
     *
     * @param hookId -  The unique id of this hook in the hookIndex
     * @param hookValue - The hook as it appears in the text
     * @param context - The current context object
     * @param childNodes - The current child nodes of this hook
     */
    loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Element[]): HookComponentData;

    /**
     * Which @Inputs() to insert and which @Outputs() to register withthe component of this hook.
     *
     * This function is called any time an update of the bindings is requested.
     *
     * @param hookId - The unique id of this hook in the hookIndex
     * @param hookValue - The hook as it appears in the text
     * @param context - The current context object
     */
    getBindings(hookId: number, hookValue: HookValue, context: any): HookBindings;
}


// Hook interfaces relevant for parsers
// --------------------------------------------

/**
 * Information about the position of a hook in the content string
 */
export interface HookPosition {
    openingTagStartIndex: number;
    openingTagEndIndex: number;
    closingTagStartIndex?: number;
    closingTagEndIndex?: number;
}

/**
 * The hook as it appears in the content string
 */
export interface HookValue {
    openingTag: string;
    closingTag: string;
}

/**
 * Various data to instantiate the hook component with
 */
export interface HookComponentData {
    component: ComponentConfig;
    injector?: Injector;
    content?: Node[][];
}

/**
 * A config object describing the component that is supposed to be loaded for this Hook
 *
 * Can be either the component class itself or a LazyLoadComponentConfig, if the component
 * should be lazy-loaded (Ivy-feature)
 */
export type ComponentConfig = (new(...args: any[]) => any) | LazyLoadComponentConfig;

/**
 * A config object for a component that is supposed to be lazy-loaded (Ivy-feature)
 *
 * importPromise has to contain a function that returns the import promise for the component file (not the import promise itself!)
 * importName has to be the name of the component class to be imported
 *
 * Example:
 * {
 *   importPromise: () => import('./someComponent/someComponent.c'),
 *   importName: 'SomeComponent'
 * }
 */
export interface LazyLoadComponentConfig {
    importPromise: () => Promise<any>;
    importName: string;
}

/**
 * An object describing the current input and outputs bindings for this Hook
 */
export interface HookBindings {
    inputs?: {[key: string]: any};
    outputs?: {[key: string]: (event: any, context: any) => any};
}


// Lifecycle interfaces
// ---------------------------------

/**
 * An optional interface to give to dynamically loaded components that implement the
 * OnDynamicMount method
 *
 * onDynamicMount is called exactly once per component as soon as all components have rendered.
 * Its data parameter contains the current context object and all DynamicContentChildren of the
 * component.
 *
 */
export interface OnDynamicMount {
    onDynamicMount(data: OnDynamicData): void;
}

/**
 * An optional interface to give to dynamically loaded components that implement the
 * OnDynamicChanges method
 *
 * onDynamicChanges is called whenever either the context object or the DynamicContentChildren of the
 * component change. Its data parameter only contains the value that changed.
 * It is therefore called:
 *
 * 1. Immediately when the component is initialized (with context as the parameter, if not undefined)
 * 2. Once all components are loaded (with contextChildren as the parameter)
 * 3. Any time that context changes by reference in the future (with the new context as the parameter)
 */
export interface OnDynamicChanges {
    onDynamicChanges(data: OnDynamicData): void;
}

/**
 * A data wrapper given as a param to OnDynamicMount and OnDynamicChanges
 */
export interface OnDynamicData {
    context?: any;
    contentChildren?: DynamicContentChild[];
}

/**
 * A single content child of a dynamically loaded component
 */
export interface DynamicContentChild {
    componentRef: ComponentRef<any>;
    componentSelector: string;
    contentChildren: Array<DynamicContentChild>;
    hookValue: HookValue;
}

// Other
// ---------------------------------

export interface OutletParseResult {
    element: HTMLElement;
    hookIndex: HookIndex;
    resolvedParsers: HookParser[];
    resolvedOptions: OutletOptions;
}

export interface LoadedComponent {
    hookId: number;
    hookValue: HookValue;
    hookParser: HookParser;
    componentRef: ComponentRef<any>;
}
