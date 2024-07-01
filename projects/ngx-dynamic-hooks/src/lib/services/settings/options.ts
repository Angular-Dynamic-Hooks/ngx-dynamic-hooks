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
    ignoreInputAliases?: boolean;
    ignoreOutputAliases?: boolean;
    acceptInputsForAnyProperty?: boolean;
    acceptOutputsForAnyObservable?: boolean;
}

/**
 * Returns the default values for the ParseOptions
 */
export const getParseOptionDefaults: (content?: any) => ParseOptions = (content = '') => {

    const parseOptionDefaults: ParseOptions = {
        sanitize: true,
        convertHTMLEntities: true,
        fixParagraphTags: true,
        updateOnPushOnly: false,
        compareInputsByValue: false,
        compareOutputsByValue: false,
        compareByValueDepth: 5,
        ignoreInputAliases: false,
        ignoreOutputAliases: false,
        acceptInputsForAnyProperty: false,
        acceptOutputsForAnyObservable: false
    };

    // Don't sanitize if content is element
    if (content && typeof content !== 'string') {
        parseOptionDefaults.sanitize = false;
    }

    return parseOptionDefaults;
}


