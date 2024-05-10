/**
 * Several options for the OutletComponent
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
 * The default values for the OutletOptions
 */
export const outletOptionDefaults: OutletOptions = {
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
