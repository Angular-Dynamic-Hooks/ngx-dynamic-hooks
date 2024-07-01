import { RichBindingData, SavedBindings } from '../../../interfaces';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings } from '../../../interfacesPublic';
import { TagHookFinder } from './tagHookFinder';
import { BindingsValueManager } from '../bindingsValueManager';
import { SelectorHookParserConfig } from '../selectorHookParserConfig';
import { SelectorHookParserConfigResolver } from '../selectorHookParserConfigResolver';
import { regexes } from '../../../constants/regexes';
import { matchAll } from '../../../services/utils/utils';

/**
 * A powerful parser for standard Angular component selectors that comes with this library
 */
export class StringSelectorHookParser implements HookParser {
  name: string|undefined;
  config: SelectorHookParserConfig;
  savedBindings: {[key: number]: SavedBindings} = {};

  constructor(config: SelectorHookParserConfig, private configResolver: SelectorHookParserConfigResolver, private tagHookFinder: TagHookFinder, private bindingsValueManager: BindingsValueManager) {
    this.config = this.configResolver.processConfig(config);
    this.name = this.config.name;
  }

  public findHooks(content: string, context: any): Array<HookPosition> {
    return this.config.enclosing ?
      this.tagHookFinder.findEnclosingTags(content, this.config.selector!, this.config.bracketStyle) :
      this.tagHookFinder.findSingleTags(content, this.config.selector!, this.config.bracketStyle);
  }

  public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Element[]): HookComponentData {
    return {
      component: this.config.component,
      hostElementTag: this.config.hostElementTag,
      injector: this.config.injector,
      environmentInjector: this.config.environmentInjector
    };
  }

  public getBindings(hookId: number, hookValue: HookValue, context: any): HookBindings {
    let hookBindings = this.savedBindings[hookId];

    // Parse bindings once from hookValue, then reuse on subsequent runs
    if (hookBindings === undefined) {
      hookBindings = this.createBindings(hookValue.openingTag!);
      this.savedBindings[hookId] = hookBindings;
    }

    // (Re)evaluate if needed
    this.bindingsValueManager.checkInputBindings(hookBindings.inputs!, context, this.config);
    this.bindingsValueManager.checkOutputBindings(hookBindings.outputs!, this.config);

    return {
      inputs: this.getValuesFromSavedBindings(hookBindings.inputs!),
      outputs: this.getValuesFromSavedBindings(hookBindings.outputs!)
    };
  }

  // Bindings
  // --------------------------------------------------------------------------

  createBindings(openingTag: string): SavedBindings {
    const rawInputs = this.collectRawInputs(openingTag!);
    const inputBindings: {[key: string]: RichBindingData} = {};
    for (const [rawInputKey, rawInputValue] of Object.entries(rawInputs)) {
      inputBindings[rawInputKey] = {raw: rawInputValue, parsed: false, value: null, boundContextVariables: {}};
    }

    const rawOutputs = this.collectRawOutputs(openingTag!);
    const outputBindings: {[key: string]: RichBindingData} = {};
    for (const [rawOutputKey, rawOutputValue] of Object.entries(rawOutputs)) {
      outputBindings[rawOutputKey] = {raw: rawOutputValue, parsed: false, value: null, boundContextVariables: {}};
    }

    return {
      inputs: inputBindings,
      outputs: outputBindings
    };
  }

  collectRawInputs (openingTag: string): {[key: string]: any} {
    const rawNoBracketInputs = this.getBindingsFromOpeningTag('noBracketInputs', openingTag, this.config.inputsBlacklist || null, this.config.inputsWhitelist || null);
    const rawBracketInputs = this.getBindingsFromOpeningTag('bracketInputs', openingTag, this.config.inputsBlacklist || null, this.config.inputsWhitelist || null);

    // NoBracketInputs are to be interpreted as plain strings, so wrap them in quotes
    for (const [noBracketInputName, noBracketInputValue] of Object.entries(rawNoBracketInputs)) {
      rawNoBracketInputs[noBracketInputName] = "'" + noBracketInputValue + "'";
    }

    // Merge both input objects
    return {...rawNoBracketInputs, ...rawBracketInputs};
  }

  collectRawOutputs(openingTag: string): {[key: string]: any} {
    return this.getBindingsFromOpeningTag('outputs', openingTag!, this.config.outputsBlacklist || null, this.config.outputsWhitelist || null);
  }

  /**
   * Takes a string selector hook opening tag and parses Angular-style bindings from it
   *
   * @param type - What kind of bindings to extract
   * @param openingTag - The opening tag to analyze
   * @param blacklist - What bindings to exlude
   * @param whitelist - What bindings to exclusively include
   */
    private getBindingsFromOpeningTag(type: 'noBracketInputs'|'bracketInputs'|'outputs', openingTag: string, blacklist: string[]|null, whitelist: string[]|null): {[key: string]: any} {
      const bindings: {[key: string]: any} = {};
  
      // Examples: https://regex101.com/r/17x3cc/16
      const attributeValuesOR = '(?:' + regexes.attributeValueDoubleQuotesRegex + '|' + regexes.attributeValueSingleQuotesRegex + ')';
      let attributeNameRegex;
      switch (type) {
        case 'noBracketInputs': attributeNameRegex = regexes.attributeNameNoBracketsRegex; break;
        case 'bracketInputs': attributeNameRegex = regexes.attributeNameBracketsRegex; break;
        case 'outputs': attributeNameRegex = regexes.attributeNameRoundBracketsRegex; break;
      }
      const attributeRegex = attributeNameRegex + '\=' + attributeValuesOR;
      const attributePattern = new RegExp(attributeRegex, 'gim');
      const attributeMatches = matchAll(openingTag, attributePattern);
  
      // Collect raw bindings
      for (const match of attributeMatches) {
        // Could be either of the attribute value capturing groups
        let rawBindingValue = match[2] || match[3];
        // If value is empty (someInput=""), it will return undefined for it. When using noBracketInputs, return empty string instead.
        if (rawBindingValue === undefined && type === 'noBracketInputs') {
          rawBindingValue = '';
        }
        bindings[match[1]] = rawBindingValue;
      }
  
      // Filter bindings
      const filteredBindings: {[key: string]: any} = {};
      for (const [bindingName, bindingValue] of Object.entries(bindings)) {
        if (blacklist && blacklist.includes(bindingName)) {
          continue;
        }
        if (whitelist && !whitelist.includes(bindingName)) {
          continue;
        }
        filteredBindings[bindingName] = bindingValue;
      }
  
      return filteredBindings;
    }

  /**
   * Transforms a RichBindingData object into a normal bindings object
   *
   * @param richBindingsObject - The object containing the RichBindingData
   */
  private getValuesFromSavedBindings(richBindingsObject: {[key: string]: RichBindingData}): {[key: string]: any} {
    const result: {[key: string]: any} = {};
    for (const [key, value] of Object.entries(richBindingsObject)) {
      result[key] = value.value;
    }
    return result;
  }
}
