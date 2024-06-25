/**
 * Several options for the DynamicHooksComponent
 */
export interface OutletOptions {
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
 * Returns the default values for the OutletOptions
 */
export const getOutletOptionDefaults: (content?: any) => OutletOptions = (content = '') => {

    const outletOptionDefaults: OutletOptions = {
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
        outletOptionDefaults.sanitize = false;
    }

    return outletOptionDefaults;
}


