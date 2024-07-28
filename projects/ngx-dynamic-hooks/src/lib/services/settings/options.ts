/**
 * Options that allow you to customize the parsing process
 */
export interface ParseOptions {
    /**
     * Whether to use Angular's `DomSanitizer` to sanitize the content (hooks are unaffected by this). Defaults to `true` if content is a string, `false` if its an HTML element.
     */
    sanitize?: boolean;

    /**
     * Whether to replace HTML entities like `&amp;` with normal characters.
     */
    convertHTMLEntities?: boolean;

    /**
     * When using a WYSIWYG-editor, enclosing text hooks may collide with its generated HTML (the `<p>`-tag starting before the hook and the corresponding `</p>`-tag ending inside, and vice versa). This will result in faulty HTML when rendered in a browser. This setting removes these ripped-apart tags.
     */
    fixParagraphTags?: boolean;

    /**
     * Whether to update the bindings of dynamic components only when the context object passed to the `DynamicHooksComponent` changes by reference.
     */
    updateOnPushOnly?: boolean;

    /**
     * Whether to deeply-compare inputs for dynamic components by their value instead of by their reference on updates.
     */
    compareInputsByValue?: boolean;

    /**
     * Whether to deeply-compare outputs for dynamic components by their value instead of by their reference on updates.
     */
    compareOutputsByValue?: boolean;

    /**
     * When comparing by value, how many levels deep to compare them (may impact performance).
     */
    compareByValueDepth?: number;

    /**
     * Whether to emit CustomEvents from the component host elements when an output emits. The event name will be the output name. Defaults to true in standalone mode, otherwise false.
     */
    triggerDOMEvents?: boolean;

    /**
     * Whether to ignore input aliases like `@Input('someAlias')` in dynamic components and use the actual property names instead.
     */
    ignoreInputAliases?: boolean;

    /**
     * Whether to ignore output aliases like `@Output('someAlias')` in dynamic components and use the actual property names instead.
     */
    ignoreOutputAliases?: boolean;

    /**
     * Whether to disregard `@Input()`-decorators completely and allow passing in values to any property in dynamic components.
     */
    acceptInputsForAnyProperty?: boolean;

    /**
     * Whether to disregard `@Output()`-decorators completely and allow subscribing to any `Observable` in dynamic components.
     */
    acceptOutputsForAnyObservable?: boolean;

    /**
     * Accepts a `LogOptions` object to customize when to log text, warnings and errors.
     */
    logOptions?: LogOptions;
}

export interface LogOptions {

    /**
     * Whether to enable logging when in dev mode
     */
    dev?: boolean;

    /**
     * Whether to enable logging when in prod mode
     */
    prod?: boolean;

    /**
     * Whether to enable logging during Server-Side-Rendering
     */
    ssr?: boolean;
}

/**
 * Returns the default values for the ParseOptions
 */
export const getParseOptionDefaults: () => ParseOptions = () => {
    return {
        sanitize: true,
        convertHTMLEntities: true,
        fixParagraphTags: true,
        updateOnPushOnly: false,
        compareInputsByValue: false,
        compareOutputsByValue: false,
        compareByValueDepth: 5,
        triggerDOMEvents: false,
        ignoreInputAliases: false,
        ignoreOutputAliases: false,
        acceptInputsForAnyProperty: false,
        acceptOutputsForAnyObservable: false,
        logOptions: {
            dev: true,
            prod: false,
            ssr: false
        }
    };
}


