import { Injectable } from '@angular/core';

import { DataTypeParser } from '../../services/utils/dataTypeParser';
import { SelectorHookParserConfig } from './selectorHookParserConfig';
import { RichBindingData } from '../../interfaces';
import { Logger } from '../../services/utils/logger';
import { ParseOptions } from '../../services/settings/options';


/**
 * A helper service for SelectorHookParsers that evaluates bindings and only updates them when needed so references are retained when possible
 */
@Injectable({
  providedIn: 'root'
})
export class BindingsValueManager {

  constructor(private dataTypeParser: DataTypeParser, private logger: Logger) {
  }

  // Inputs
  // -------------------------------------------------------------------------------------

  /**
   * Checks input bindings and evaluates/updates them as needed
   *
   * @param bindings - A list of @Input() bindings
   * @param context - The current context object
   * @param parserConfig - The parser config
   */
  checkInputBindings(bindings: {[key: string]: RichBindingData}, context: any, parserConfig: SelectorHookParserConfig, options: ParseOptions) {
    for (const [inputName, inputBinding] of Object.entries(bindings)) {
      // If no need to parse, use raw as value
      if (!parserConfig.parseInputs) {
        inputBinding.value = inputBinding.raw;
    
      } else {
        // If not yet parsed, do so
        if (!inputBinding.parsed) {
          try {
            inputBinding.value = this.dataTypeParser.evaluate(
              inputBinding.raw,
              parserConfig.allowContextInBindings ? context : {},
              undefined,
              parserConfig.unescapeStrings,
              inputBinding.boundContextVariables,
              parserConfig.allowContextFunctionCalls,
              options
            );
            inputBinding.parsed = true;
          } catch (e: any) {
            this.logger.error([`Hook input parsing error\nselector: ` + parserConfig.selector +  `\ninput: ` + inputName + `\nvalue: "` + inputBinding.value + `"`], options);
            this.logger.error([e.stack], options);
            // If binding could not be parsed at all due to syntax error, remove from list of inputs.
            // No amount of calls to updateInputBindings() will fix this kind of error.
            delete bindings[inputName];
          }

        // Otherwise check if needs an update
        } else {
          this.updateInputBindingIfStale(inputBinding, context, parserConfig);
        }
      }
    }
  }

  /**
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
   * @param binding - The previous bindings
   * @param context - The current context object
   * @param parserConfig - The current parser config
   */
  private updateInputBindingIfStale(binding: RichBindingData, context: any, parserConfig: SelectorHookParserConfig): void {

    if (Object.keys(binding.boundContextVariables).length > 0) {
      // Check if bound context vars have changed
      let boundContextVarHasChanged = false;
      for (const [contextVarName, contextVarValue] of Object.entries(binding.boundContextVariables)) {
        const encodedContextVarName = this.dataTypeParser.encodeDataTypeString(contextVarName);
        // Compare with previous value
        const newContextVarValue = this.dataTypeParser.loadContextVariable(encodedContextVarName, context, undefined, parserConfig.unescapeStrings, {}, parserConfig.allowContextFunctionCalls);
        if (newContextVarValue !== contextVarValue) {
          boundContextVarHasChanged = true;
          break;
        }
      }

      // Bound context var has changed! Reevaluate whole binding (which may include more than one context var, or point to some child property)
      if (boundContextVarHasChanged) {
        binding.boundContextVariables = {};
        binding.value = this.dataTypeParser.evaluate(
          binding.raw,
          parserConfig.allowContextInBindings ? context : {},
          undefined,
          parserConfig.unescapeStrings,
          binding.boundContextVariables,
          parserConfig.allowContextFunctionCalls
        );
      }
    }
  }

  // Outputs
  // -------------------------------------------------------------------------------------

  /**
   * Takes a standard hook opening tag and parses Angular-style inputs from it
   *
   * @param openingTag - The hook opening tag to parse
   * @param parserConfig - The current parser config
   */
  checkOutputBindings(bindings: {[key: string]: RichBindingData}, parserConfig: SelectorHookParserConfig, options: ParseOptions) {
    for (const [outputName, outputBinding] of Object.entries(bindings)) {
      // Unlike inputs, outputs only need to be created once by the parser, never updated, as you only create a wrapper function around the logic to execute.
      // As this logic is run fresh whenever the output triggers, there is no need to replace this wrapper function on updates.
      if (!outputBinding.parsed) {
        outputBinding.value = (event: any, context: any) => {
          try {
            this.dataTypeParser.evaluate(
              outputBinding.raw,
              parserConfig.allowContextInBindings ? context : {},
              event,
              parserConfig.unescapeStrings,
              outputBinding.boundContextVariables,
              parserConfig.allowContextFunctionCalls
            );
          } catch (e: any) {
            this.logger.error([`Hook output parsing error\nselector: ` + parserConfig.selector +  `\noutput: ` + outputName + `\nvalue: "` + outputBinding.value + `"`], options);
            this.logger.error([e.stack], options);
          }
        };
        outputBinding.parsed = true;
      }
    }
  }

}
