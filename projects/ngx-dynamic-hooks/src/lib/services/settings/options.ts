/**
 * Several options for the DynamicHooksComponent
 */
export interface ParseOptions {
    sanitize?: boolean;
    convertHTMLEntities?: boolean;
    fixParagraphTags?: boolean;
    updateOnPushOnly?: boolean;
    compareInputsByValue?: boolean;
    compareOutputsByValue?: boolean;
    compareByValueDepth?: number;
    triggerDOMEvents?: boolean;
    ignoreInputAliases?: boolean;
    ignoreOutputAliases?: boolean;
    acceptInputsForAnyProperty?: boolean;
    acceptOutputsForAnyObservable?: boolean;
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
        acceptOutputsForAnyObservable: false
    };
}


