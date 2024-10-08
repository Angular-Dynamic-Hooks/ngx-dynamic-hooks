import { RichBindingData, SavedBindings } from '../../../interfaces';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings } from '../../../interfacesPublic';
import { TagHookFinder } from './tagHookFinder';
import { BindingsValueManager } from '../bindingsValueManager';
import { SelectorHookParserConfig } from '../selectorHookParserConfig';
import { SelectorHookParserConfigResolver } from '../selectorHookParserConfigResolver';
import { regexes } from '../../../constants/regexes';
import { matchAll } from '../../../services/utils/utils';
import { ParseOptions } from '../../../services/settings/options';

/**
 * A text parser to load components with their bindings like in Angular templates.
 */
export class TextSelectorHookParser implements HookParser {
  name: string|undefined;
  config: SelectorHookParserConfig;
  savedBindings: {[key: number]: SavedBindings} = {};

  constructor(config: SelectorHookParserConfig, private configResolver: SelectorHookParserConfigResolver, private tagHookFinder: TagHookFinder, private bindingsValueManager: BindingsValueManager) {
    this.config = this.configResolver.processConfig(config);
    this.name = this.config.name;
  }

  public findHooks(content: string, context: any, options: ParseOptions): HookPosition[] {
    let hookPositions = this.config.enclosing ?
      this.tagHookFinder.findEnclosingTags(content, this.config.selector!, this.config.bracketStyle, options) :
      this.tagHookFinder.findSingleTags(content, this.config.selector!, this.config.bracketStyle, options);

    if (this.config.allowSelfClosing) {
      hookPositions = [
        ...hookPositions, 
        ...this.tagHookFinder.findSelfClosingTags(content, this.config.selector!, this.config.bracketStyle, options)
      ];
      hookPositions.sort((a, b) => a.openingTagStartIndex - b.openingTagStartIndex);
    }
    
    return hookPositions;
  }

  public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: any[], options: ParseOptions): HookComponentData {
    return {
      component: this.config.component,
      hostElementTag: this.config.hostElementTag || this.config.selector, // If no hostElementTag specified, use selector (which in the case of TextSelectorHookParser is only allowed to be tag name)
      injector: this.config.injector,
      environmentInjector: this.config.environmentInjector
    };
  }

  public getBindings(hookId: number, hookValue: HookValue, context: any, options: ParseOptions): HookBindings {
    let hookBindings = this.savedBindings[hookId];

    // Parse bindings once from hookValue, then reuse on subsequent runs
    if (hookBindings === undefined) {
      hookBindings = this.createBindings(hookValue.openingTag!);
      this.savedBindings[hookId] = hookBindings;
    }

    // (Re)evaluate if needed
    this.bindingsValueManager.checkInputBindings(hookBindings.inputs!, context, this.config, options);
    this.bindingsValueManager.checkOutputBindings(hookBindings.outputs!, this.config, options);

    return {
      inputs: this.getValuesFromSavedBindings(hookBindings.inputs!),
      outputs: this.getValuesFromSavedBindings(hookBindings.outputs!)
    };
  }

  // Bindings
  // --------------------------------------------------------------------------

  /**
   * Returns RichBindingData for Angular-style inputs & output attrs from an openingTag
   * 
   * @param openingTag - The openingTag to inspect
   */
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

  /**
   * Collects Angular-style inputs from an openingTag
   *
   * @param openingTag - The openingTag to inspect
   */
  collectRawInputs (openingTag: string): {[key: string]: any} {
    const rawNoBracketInputs = this.getBindingsFromOpeningTag(openingTag, 'noBracketInputs', this.config.inputsBlacklist || null, this.config.inputsWhitelist || null);
    const rawBracketInputs = this.getBindingsFromOpeningTag(openingTag, 'bracketInputs', this.config.inputsBlacklist || null, this.config.inputsWhitelist || null);

    // NoBracketInputs are to be interpreted as plain strings, so wrap them in quotes
    for (const [noBracketInputName, noBracketInputValue] of Object.entries(rawNoBracketInputs)) {
      rawNoBracketInputs[noBracketInputName] = "'" + noBracketInputValue + "'";
    }

    // Merge both input objects
    return {...rawNoBracketInputs, ...rawBracketInputs};
  }

  /**
   * Collects Angular-style outputs from an openingTag
   *
   * @param openingTag - The openingTag to inspect
   */
  collectRawOutputs(openingTag: string): {[key: string]: any} {
    return this.getBindingsFromOpeningTag(openingTag!, 'outputs', this.config.outputsBlacklist || null, this.config.outputsWhitelist || null);
  }

  /**
   * Collects Angular-style inputs or outputs from an openingTag
   *
   * @param type - What kind of bindings to extract
   * @param openingTag - The opening tag to inspect
   * @param blacklist - A list of inputs/outputs to blacklist
   * @param whitelist - A list of inputs/outputs to whitelist
   */
    private getBindingsFromOpeningTag(openingTag: string, type: 'noBracketInputs'|'bracketInputs'|'outputs', blacklist: string[]|null, whitelist: string[]|null): {[key: string]: any} {
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
