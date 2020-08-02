import { Injectable } from '@angular/core';
import { OutletOptions, outletOptionDefaults } from './options';

@Injectable({
  providedIn: 'root',
})
export class OptionsResolver {

  constructor() {
  }

  resolve(uo: OutletOptions): OutletOptions {
    const newOptions = JSON.parse(JSON.stringify(outletOptionDefaults));
    if (uo) {
        if (uo.hasOwnProperty('sanitize') && typeof uo.sanitize === 'boolean') { newOptions.sanitize = uo.sanitize; }
        if (uo.hasOwnProperty('convertHTMLEntities') && typeof uo.convertHTMLEntities === 'boolean') { newOptions.convertHTMLEntities = uo.convertHTMLEntities; }
        if (uo.hasOwnProperty('fixParagraphArtifacts') && typeof uo.fixParagraphArtifacts === 'boolean') { newOptions.fixParagraphArtifacts = uo.fixParagraphArtifacts; }
        if (uo.hasOwnProperty('changeDetectionStrategy') && typeof uo.changeDetectionStrategy === 'string') {
          const lower = uo.changeDetectionStrategy.toLowerCase();
          if (lower === 'default' || lower === 'onpush') {
            newOptions.changeDetectionStrategy = uo.changeDetectionStrategy;
          }
        }
        if (uo.hasOwnProperty('compareInputsByValue') && typeof uo.compareInputsByValue === 'boolean') { newOptions.compareInputsByValue = uo.compareInputsByValue; }
        if (uo.hasOwnProperty('compareOutputsByValue') && typeof uo.compareOutputsByValue === 'boolean') { newOptions.compareOutputsByValue = uo.compareOutputsByValue; }
        if (uo.hasOwnProperty('compareByValueDepth') && typeof uo.compareByValueDepth === 'number') { newOptions.compareByValueDepth = uo.compareByValueDepth; }
        if (uo.hasOwnProperty('ignoreInputAliases') && typeof uo.ignoreInputAliases === 'boolean') { newOptions.ignoreInputAliases = uo.ignoreInputAliases; }
        if (uo.hasOwnProperty('ignoreOutputAliases') && typeof uo.ignoreOutputAliases === 'boolean') { newOptions.ignoreOutputAliases = uo.ignoreOutputAliases; }
        if (uo.hasOwnProperty('acceptInputsForAnyProperty') && typeof uo.acceptInputsForAnyProperty === 'boolean') { newOptions.acceptInputsForAnyProperty = uo.acceptInputsForAnyProperty; }
        if (uo.hasOwnProperty('acceptOutputsForAnyObservable') && typeof uo.acceptOutputsForAnyObservable === 'boolean') { newOptions.acceptOutputsForAnyObservable = uo.acceptOutputsForAnyObservable; }
    }
    return newOptions;
  }
}
