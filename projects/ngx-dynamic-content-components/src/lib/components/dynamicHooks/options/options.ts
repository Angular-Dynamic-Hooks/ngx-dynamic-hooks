/**
 * Several options for the DynamicHooksComponent
 */
export interface OutletOptions {
    sanitize?: boolean;
    convertHTMLEntities?: boolean;
    fixParagraphArtifacts?: boolean;
    changeDetectionStrategy?: string;
    compareInputsByValue?: boolean;
    compareOutputsByValue?: boolean;
    compareByValueDepth?: number;
    ignoreInputAliases?: boolean;
    ignoreOutputAliases?: boolean;
    acceptInputsForAnyProperty?: boolean;
    acceptOutputsForAnyObservable?: boolean;
}

/**
 * The default values for the DynamicHooksComponentOptions
 */
export const outletOptionDefaults: OutletOptions = {
    sanitize: true,
    convertHTMLEntities: true,
    fixParagraphArtifacts: true,
    changeDetectionStrategy: 'default',
    compareInputsByValue: false,
    compareOutputsByValue: false,
    compareByValueDepth: 5,
    ignoreInputAliases: false,
    ignoreOutputAliases: false,
    acceptInputsForAnyProperty: false,
    acceptOutputsForAnyObservable: false
};
