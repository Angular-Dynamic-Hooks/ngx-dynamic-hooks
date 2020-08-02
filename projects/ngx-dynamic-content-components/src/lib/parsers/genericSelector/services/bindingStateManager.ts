import { isDevMode, Injectable, Injector } from '@angular/core';

import { regexes } from '../../../utils/regexes';
import { DataTypeParser } from '../../../utils/dataTypeParser';
import { GenericSelectorParserConfig } from '../config/parserConfig';
import { RichBindingData } from '../../../interfaces';
import { matchAll } from '../../../polyfills/matchAll';

/**
 * Functions for finding, parsing and analyzing generic hooks
 */
@Injectable()
export class BindingStateManager {

  constructor(private dataTypeParser: DataTypeParser) {
  }

  // 1. Inputs
  // -------------------------------------------------------------------------------------

  getCurrentInputBindings(openingTag: string, context: {[key: string]: any}, parserConfig: GenericSelectorParserConfig, currentInputBindings: {[key: string]: RichBindingData}): {[key: string]: RichBindingData} {
    // If this is initial evaluation, create bindings object
    if (currentInputBindings === undefined) {
      currentInputBindings = this.createInputBindings(openingTag, context, parserConfig);
    // If this is subsequent evaluation, update bindings object
    } else {
      this.updateInputBindings(currentInputBindings, context, parserConfig);
    }

    return currentInputBindings;
  }

  /**
   * Creates the input bindings object on the first evaluation of a hook
   *
   * @param context - The current context object
   * @param parserConfig - The current parserConfig
   */
  private createInputBindings(openingTag: string, context: {[key: string]: any}, parserConfig: GenericSelectorParserConfig): {[key: string]: RichBindingData} {
    // Read inputs from opening tag
    const rawInputs = this.getBindingsFromOpeningTag('inputs', openingTag, parserConfig.inputsBlacklist, parserConfig.inputsWhitelist);

    // Create bindings object
    const inputBindings: {[key: string]: RichBindingData} = {};
    for (const [rawInputKey, rawInputValue] of Object.entries(rawInputs)) {
      inputBindings[rawInputKey] = {
        raw: rawInputValue,
        value: rawInputValue,
        boundContextVariables: {}
      };
    }

    // If no need to parse, return result immediately
    if (!parserConfig.parseInputs) {
      return inputBindings;
    }

    // Should the input strings be evaluated as proper variables?
    for (const [inputName, inputBinding] of Object.entries(inputBindings)) {
      try {
        inputBindings[inputName].value = this.dataTypeParser.evaluateDataTypeFromString(
          inputBinding.raw,
          parserConfig.allowContextInBindings ? context : {},
          undefined,
          parserConfig.unescapeStrings,
          inputBindings[inputName].boundContextVariables,
          parserConfig.allowContextFunctionCalls
        );
      } catch (e) {
        if (isDevMode()) {
          e.message = `DynCompHooks: Hook input parsing error\nselector: ` + parserConfig.selector +  `\ninput: ` + inputName + `\nvalue: "` + inputBinding.value + `"\nmessage: "` + e.message + `"`;
          console.error(e);
        }
        // If binding could not be parsed at all due to syntax error, remove from list of inputs.
        // No amount of calls to updateInputBindings() will fix this kind of error.
        delete inputBindings[inputName];
      }
    }

    return inputBindings;
  }

  /**
   * Updates the input bindings object on subsequent evaluations of a hook
   *
   * We can detect if a binding needs to be reevaluated via the bound context variables. There are three cases to consider:
   *
   * a) If a binding does not use context vars, don't reevaluate (binding is static and won't ever need to be updated)
   * b) If a binding does use context vars, but context vars haven't changed, don't reevaluate either (would evalute the same)
   * c) If a binding uses context vars and they have changed, reevaluate the binding from scratch to get the new version
   *
   * This is in line with the standard Angular behavior when evaluating template vars like [input]="{prop: this.something}".
   * When 'this.something' changes so that it returns false on a === comparison with its previous value, Angular does not
   * simply replace the reference bound to 'prop', but recreates the whole object literal and passes a new reference into the
   * input, triggering ngOnChanges.
   *
   * @param inputs - An object with the input names as keys and their content as values
   * @param context - The current context object
   * @param parserConfig - The current parserConfig
   */
  private updateInputBindings(currentInputBindings: {[key: string]: RichBindingData}, context: {[key: string]: any}, parserConfig: GenericSelectorParserConfig): void {

    for (const inputBinding of Object.values(currentInputBindings)) {
      if (Object.keys(inputBinding.boundContextVariables).length > 0) {
        // Check if bound context vars have changed
        let boundContextVarHasChanged = false;
        for (const [contextVarName, contextVarValue] of Object.entries(inputBinding.boundContextVariables)) {
          const encodedContextVarName = this.dataTypeParser.encodeDataTypeString(contextVarName);
          // Compare with previous value
          if (this.dataTypeParser.safelyLoadContextVariable(encodedContextVarName, context, undefined, parserConfig.unescapeStrings, {}, parserConfig.allowContextFunctionCalls) !== contextVarValue) {
            boundContextVarHasChanged = true;
            break;
          }
        }

        // Bound context var has changed! Reevaluate binding
        if (boundContextVarHasChanged) {
          inputBinding.boundContextVariables = {};
          inputBinding.value = this.dataTypeParser.evaluateDataTypeFromString(
            inputBinding.raw,
            parserConfig.allowContextInBindings ? context : {},
            undefined,
            parserConfig.unescapeStrings,
            inputBinding.boundContextVariables,
            parserConfig.allowContextFunctionCalls
          );
        }
      }
    }
  }

  // 2. Outputs
  // -------------------------------------------------------------------------------------

  getCurrentOutputBindings(openingTag: string, parserConfig: GenericSelectorParserConfig, currentOutputBindings: {[key: string]: RichBindingData}): {[key: string]: RichBindingData} {
    // As opposed to inputs, outputs only need to be processed once by a parser, as this process only
    // consists of wrapping the data type evaluation into an outer function so it can be executed later
    // when the output triggers, in which case the data type will always be evaluated fresh.
    // There is no need to replace this outer function on updates.
    if (currentOutputBindings === undefined) {
      currentOutputBindings = this.createOutputBindings(openingTag, parserConfig);
    }

    return currentOutputBindings;
  }


  /**
   * Takes a standard hook opening tag and parses Angular-style inputs from it
   *
   * @param openingTag - The hook opening tag to parse
   */
  private createOutputBindings(openingTag: string, parserConfig: GenericSelectorParserConfig): {[key: string]: RichBindingData} {
    const rawOutputs = this.getBindingsFromOpeningTag('outputs', openingTag, parserConfig.outputsBlacklist, parserConfig.outputsWhitelist);

    // Create bindings object
    const outputBindings: {[key: string]: RichBindingData} = {};
    for (const [rawOutputKey, rawOutputValue] of Object.entries(rawOutputs)) {
      outputBindings[rawOutputKey] = {
        raw: rawOutputValue,
        value: rawOutputValue,
        boundContextVariables: {}
      };
    }

    // Should the input strings be evaluated as proper variables?
    for (const [outputName, outputBinding] of Object.entries(outputBindings)) {
      // Simply wrap evaluateDataTypeFromString() into outer function that will be called when the corresponding event emits
      // If the dataTypeString contains a function, it will therefore be evaluated and executed "just-in-time".
      // If it contains a variable, nothing will happen as the the evaluated dataTypeString is not assigned anywhere and simply discarded.
      outputBindings[outputName].value = (event, context) => {
        try {
          this.dataTypeParser.evaluateDataTypeFromString(
            outputBinding.raw,
            parserConfig.allowContextInBindings ? context : {},
            event,
            parserConfig.unescapeStrings,
            outputBinding.boundContextVariables,
            parserConfig.allowContextFunctionCalls
          );
        } catch (e) {
          if (isDevMode()) {
            e.message = `DynCompHooks: Hook output parsing error\nselector: ` + parserConfig.selector +  `\noutput: ` + outputName + `\nvalue: "` + outputBinding.raw + `"\nmessage: "` + e.message + `"`;
            console.error(e);
          }
        }
      };
    }

    return outputBindings;
  }

  // 3. Shared
  // -------------------------------------------------------------------------------------

  /**
   * Takes a standard hook opening tag and parses Angular-style inputs from it
   *
   * @param openingTag - The hook opening tag to parse
   * @param parserConfig - The current parserConfig
   */
  private getBindingsFromOpeningTag(type: 'inputs'|'outputs', openingTag: string, blacklist: string[], whitelist: string[]): {[key: string]: any} {
    const bindings = {};

    // Examples: https://regex101.com/r/17x3cc/16
    const attributeValuesOR = '(?:' + regexes.attributeValueDoubleQuotesRegex + '|' + regexes.attributeValueSingleQuotesRegex + ')';
    const attributeRegex = (type === 'inputs' ? regexes.attributeNameBracketsRegex : regexes.attributeNameRoundBracketsRegex) + '\=' + attributeValuesOR;
    const attributePattern = new RegExp(attributeRegex, 'gims');
    const attributeMatches = matchAll(openingTag, attributePattern);

    // Collect raw inputs
    for (const match of attributeMatches) {
      bindings[match[1]] = match[2] || match[3]; // Could be either of the attribute value capturing groups
    }

    // Filter inputs
    const filteredBindings = {};
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

}
