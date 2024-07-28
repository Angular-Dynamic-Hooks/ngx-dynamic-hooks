import { ComponentRef, EnvironmentInjector, Injector } from '@angular/core';
import { ParseOptions } from './services/settings/options';
import { Subscription } from 'rxjs';
import { DetailedStringifyResult } from './services/utils/deepComparer';

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
    data: HookComponentData|null;
    isLazy: boolean;
    componentRef: ComponentRef<any>|null;
    bindings: HookBindings|null;
    previousBindings: PreviousHookBindings|null;
    dirtyInputs: Set<string>;
    outputSubscriptions: {[key: string]: Subscription};
    htmlEventSubscriptions: {[key: string]: Subscription};
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
    stringified: DetailedStringifyResult|null;
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
     * Returns the positions of all text hooks in the content string.
     *
     * Note: Each parser needs to implement either findHooks or findHookElements. The function is then called once for each parser.
     *
     * @param content - The content to search for hooks
     * @param context - The current context object
     */
    findHooks?(content: string, context: any, options: ParseOptions): HookPosition[];

    /**
     * Returns the hook elements that should serve as host elements for components in the content.
     *
     * Note: Each parser needs to implement either findHooks or findHookElements. The function is then called once for each parser.
     *
     * @param content - The content element to search for hooks (usually a standard Element)
     * @param context - The current context object
     */
    findHookElements?(contentElement: any, context: any, options: ParseOptions): any[];

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
    loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: any[], options: ParseOptions): HookComponentData;

    /**
     * Which @Inputs() to insert and which @Outputs() to register with the component of this hook.
     *
     * This function is called any time an update of the bindings is requested.
     *
     * @param hookId - The unique id of this hook in the hookIndex
     * @param hookValue - The hook as it appears in the text
     * @param context - The current context object
     */
    getBindings(hookId: number, hookValue: HookValue, context: any, options: ParseOptions): HookBindings;
}


// Hook interfaces relevant for parsers
// --------------------------------------------

/**
 * Information about the position of a hook in the content string
 */
export interface HookPosition {
    openingTagStartIndex: number;
    openingTagEndIndex: number;
    closingTagStartIndex?: number|null;
    closingTagEndIndex?: number|null;
}

/**
 * The hook as it appears in the content string
 */
export interface HookValue {
    openingTag?: string|null;
    closingTag?: string|null;
    element?: any;
    elementSnapshot?: any;
}

/**
 * Various data to instantiate the hook component with
 */
export interface HookComponentData {
    component: ComponentConfig;
    hostElementTag?: string;
    injector?: Injector;
    environmentInjector?: EnvironmentInjector;
    content?: any[][];
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
    contentChildren: DynamicContentChild[];
    hookValue: HookValue;
}

// Parsing interfaces
// ---------------------------------

export interface ParseResult {
    element: any;
    hookIndex: HookIndex;
    context: any;
    usedParsers: HookParser[];
    usedOptions: ParseOptions;
    usedInjector: Injector;
    usedEnvironmentInjector: EnvironmentInjector;
    destroy: () => void;
}

export interface LoadedComponent {
    hookId: number;
    hookValue: HookValue;
    hookParser: HookParser;
    componentRef: ComponentRef<any>;
}
