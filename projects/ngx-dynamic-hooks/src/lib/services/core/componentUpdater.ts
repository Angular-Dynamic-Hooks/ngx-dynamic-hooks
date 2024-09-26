import { Injectable, reflectComponentType, ChangeDetectorRef} from '@angular/core';
import { Observable } from 'rxjs';

import { Hook, HookIndex, PreviousHookBinding } from '../../interfacesPublic';
import { ParseOptions } from '../../services/settings/options';
import { DeepComparer, DetailedStringifyResult } from '../utils/deepComparer';
import { Logger } from '../utils/logger';

/**
 * The service responsible for updating dynamically created components
 */
@Injectable({
  providedIn: 'root'
})
export class ComponentUpdater {

  constructor(private deepComparer: DeepComparer, private logger: Logger) {
  }

  /**
   * Invoked when the inputs/outputs should be checked for updates
   *
   * @param hookIndex - The current hookIndex
   * @param context - The new context object
   * @param options - The current ParseOptions
   * @param triggerOnDynamicChanges - Whether to trigger the OnDynamicChanges method of dynamically loaded components
   */
  refresh(hookIndex: HookIndex, context: any, options: ParseOptions, triggerOnDynamicChanges: boolean): void {

    // Update bindings for all loaded hooks
    for (const [hookId, hook] of Object.entries(hookIndex)) {
      this.updateBindings(hook, context, options);
    }

    // Also: If context has changed by reference, call OnDynamicChanges() for all created components.
    if (triggerOnDynamicChanges) {
      for (const hook of Object.values(hookIndex)) {
        if (!hook.componentRef) { 
          return; 
        }

        if (typeof hook.componentRef.instance['onDynamicChanges'] === 'function') {
          hook.componentRef.instance['onDynamicChanges']({context});
        }
      }
    }
  }

  /**
   * Creates or updates bindings for a hook with a loaded component
   * 
   * @param hook - THe hook to update
   * @param context - The context object
   * @param options - The current ParseOptions
   */
  updateBindings(hook: Hook, context: any, options: ParseOptions) {
    if (!hook.componentRef) { 
      return; 
    }

    // Update bindings
    hook.bindings = hook.parser.getBindings(hook.id, hook.value, context, options);
    this.updateComponentWithNewInputs(hook, options);
    this.updateComponentWithNewOutputs(hook, context, options);

    // Snapshot bindings for comparison next time
    hook.previousBindings = {
      inputs: this.savePreviousBindings(hook, 'inputs', options.compareInputsByValue!, options.compareByValueDepth!),
      outputs: this.savePreviousBindings(hook, 'outputs', options.compareOutputsByValue!, options.compareByValueDepth!)
    };
  }

  /**
   * Creates a list of all previous bindings along with their stringified values
   *
   * @param hook - The hook to check
   * @param type - The type of bindings that should be saved
   * @param saveStringified - Whether to save the stringified value in addition to the reference
   * @param stringifyDepth - How many levels deep to stringify the previous bindings
   */
  savePreviousBindings(hook: Hook, type: 'inputs'|'outputs', saveStringified: boolean, stringifyDepth: number): {[key: string]: PreviousHookBinding} {
    const result: {[key: string]: PreviousHookBinding} = {};
    if (hook.bindings!.hasOwnProperty(type)) {
      for (const [bindingName, bindingValue] of Object.entries(hook.bindings![type] as any)) {
        result[bindingName] = {
          reference: bindingValue,
          stringified: saveStringified ? this.deepComparer.detailedStringify(bindingValue, stringifyDepth) : null // To compare by value
        };
      }
    }
    return result;
  }

  // Updating bindings
  // ----------------------------------------------------------------------------------------------------------------

  /**
   * Processes a hook object and updates the inputs of a dynamic component where required
   *
   * @param hook - The hook in question
   * @param options - The current ParseOptions
   */
  updateComponentWithNewInputs(hook: Hook, options: ParseOptions): void {
    const component = hook.componentRef!.instance;

    // Find out which inputs have changed
    const changedInputs = this.getChangedBindings(hook, 'inputs', options);

    // Check if inputs exists on component
    const existingInputs: {
      propName: string,
      templateName: string|null,
      value: any
    }[] = [];

    const compMeta = reflectComponentType(hook.componentRef!.componentType)!;

    for (const [inputName, inputValue] of Object.entries(changedInputs)) {
      // Some naming tolerance: Input name can be case-insensitive and in dash-case.
      // Look for more literal matches first (transformed dash-case + case-insensitive has lowest priority)
      const metaKey = options.ignoreInputAliases ? 'propName' : 'templateName';
      const inputEntry = 
        compMeta.inputs.find(inputObject => inputName === inputObject[metaKey]) ||
        compMeta.inputs.find(inputObject => inputName.toLowerCase() === inputObject[metaKey].toLowerCase()) ||
        compMeta.inputs.find(inputObject => inputName.replace(/-/g, '') === inputObject[metaKey]) ||
        compMeta.inputs.find(inputObject => inputName.replace(/-/g, '').toLowerCase() === inputObject[metaKey].toLowerCase())

      // If actual input was found, add it
      if (inputEntry) {
        existingInputs.push({
          propName: inputEntry.propName,
          templateName: inputEntry.templateName,
          value: inputValue
        });

      // If not, but accepts any property as input, add it anyway
      } else if (options.acceptInputsForAnyProperty) {
        // If property exists (in a case-agnostic way), use it. Otherwise create literal new property.
        let foundInputProp = 
          Object.getOwnPropertyNames(component).find(propName => inputName === propName) ||
          Object.getOwnPropertyNames(component).find(propName => inputName.toLowerCase() === propName.toLowerCase());

        const finalInputProp = foundInputProp || inputName;

        // Even this setting has limits. Don't allow setting fundamental JavaScript object properties.
        if (!['__proto__', 'prototype', 'constructor'].includes(finalInputProp)) {
          existingInputs.push({
            propName: finalInputProp,
            templateName: null,
            value: inputValue
          });
        } else {
          this.logger.error(['Tried to overwrite a __proto__, prototype or constructor property with input "' + finalInputProp + '" for hook "' + hook.componentRef!.componentType.name + '". This is not allowed.'], options);
          continue;
        }
      }
    }

    // Set inputs in component
    for (const {propName, templateName, value} of existingInputs) {
      if (templateName) {
        hook.componentRef?.setInput(templateName, value);             // Official method to set inputs. Sets property, triggers OnChanges and marks for OnPush. Also works with new signal inputs.
      } else if (propName) {
        hook.componentRef!.instance[propName] = value;                // Resort to manual setting only if prop isn't a declared input (may happen with "acceptInputsForAnyProperty")
      }
    }

    // Important: Still need to trigger cd, even with componentRef.setInput
    if (existingInputs.length) {
      hook.componentRef?.changeDetectorRef.detectChanges();
    }
  }

  /**
   * Processes a hook object and (re)subscribes the outputs of a dynamic component where required
   *
   * @param hook - The hook in question
   * @param context - The current context object
   * @param options - The current ParseOptions
   */
  updateComponentWithNewOutputs(hook: Hook, context: any, options: ParseOptions): void {
    const component = hook.componentRef!.instance;

    // Find out which outputs have changed
    const changedOutputs: {[key: string]: (e: any, c: any) => any} = this.getChangedBindings(hook, 'outputs', options);

    // Check if outputs exist on component
    const existingOutputs: {
      propName: string,
      templateName: string|null,
      value: (e: any, c: any) => any
    }[] = [];

    const compMeta = reflectComponentType(hook.componentRef!.componentType)!;

    for (const [outputName, outputCallback] of Object.entries(changedOutputs)) {
      const metaKey = options.ignoreOutputAliases ? 'propName' : 'templateName';
      const outputEntry = 
        compMeta.outputs.find(outputObject => outputName === outputObject[metaKey]) ||
        compMeta.outputs.find(outputObject => outputName.toLowerCase() === outputObject[metaKey].toLowerCase()) ||
        compMeta.outputs.find(outputObject => outputName.replace(/-/g, '') === outputObject[metaKey]) ||
        compMeta.outputs.find(outputObject => outputName.replace(/-/g, '').toLowerCase() === outputObject[metaKey].toLowerCase())

      if (outputEntry) {
        existingOutputs.push({
          propName: outputEntry.propName,
          templateName: outputEntry.templateName,
          value: outputCallback
        });
      
      } else if (options.acceptOutputsForAnyObservable) {
        // If observable exists (in a case-agnostic way), use it
        let foundOutputProp = 
          Object.getOwnPropertyNames(component).find(propName => component[propName] instanceof Observable && outputName === propName) ||
          Object.getOwnPropertyNames(component).find(propName => component[propName] instanceof Observable && outputName.toLowerCase() === propName.toLowerCase());
      
        if (foundOutputProp) {
          existingOutputs.push({
            propName: foundOutputProp,
            templateName: null,
            value: outputCallback
          });
        }
      }
    }  

    // (Re)subscribe to outputs, store subscription in Hook
    for (const {propName, templateName, value} of existingOutputs) {
      if (hook.outputSubscriptions[propName]) { hook.outputSubscriptions[propName].unsubscribe(); }
      hook.outputSubscriptions[propName] = hook.componentRef!.instance[propName].subscribe((event: any) => {
        value(event, context);
      });
    }
  }

  /**
   * Compares the current with the previous bindings and returns those that have changed
   *
   * @param hook - The hook in question
   * @param type - What kind of binding to check
   * @param options - The current ParseOptions
   */
  getChangedBindings(hook: Hook, type: 'inputs'|'outputs', options: ParseOptions): {[key: string]: any} {
    const changedBindings: {[key: string]: any} = {};
    if (hook.bindings!.hasOwnProperty(type)) {
      for (const [key, binding] of Object.entries(hook.bindings![type] as any)) {

        // If binding did not exist in previous hook data, binding is considered changed
        if (!hook.previousBindings || !hook.previousBindings[type].hasOwnProperty(key)) {
          changedBindings[key] = binding;
          continue;
        }

        // Compare old with new
        // a) By reference
        if (type === 'inputs' ? !options.compareInputsByValue : !options.compareOutputsByValue) {
          if (binding !== hook.previousBindings[type][key].reference) {
            changedBindings[key] = binding;
          }
        // b) By value
        } else {
          const stringifiedBinding = this.deepComparer.detailedStringify(binding, options.compareByValueDepth);
          const canBeComparedByValue = this.checkDetailedStringifyResultPair(key, hook.componentRef!.componentType.name, options, hook.previousBindings[type][key].stringified!, stringifiedBinding);

          if (canBeComparedByValue) {
            if (stringifiedBinding.result !== hook.previousBindings[type][key].stringified!.result) {
              changedBindings[key] = binding;
            }
          } else {
            if (binding !== hook.previousBindings[type][key].reference) {
              changedBindings[key] = binding;
            }
          }
        }
      }
    }

    return changedBindings;
  }

  /**
   * Checks whether two detailedStringifiedResults can be compared and throws lots of errors and warnings if not
   *
   * @param bindingName - The binding in question
   * @param componentName - The component in question
   * @param options - The current ParseOptions
   * @param oldResult - The detailedStringifiedResult for the old value
   * @param newResult - The detailedStringifiedResult for the new value
   */
  checkDetailedStringifyResultPair(bindingName: string, componentName: string, options: ParseOptions, oldResult: DetailedStringifyResult, newResult: DetailedStringifyResult): boolean {
    // Stringify successful?
    if (oldResult.result === null && newResult.result === null) {
      this.logger.warn(['Could stringify neither new nor old value for hook binding "' + bindingName + '" for component "' + componentName + '" to compare by value. Defaulting to comparison by reference instead.'], options);
      return false;
    }
    if (oldResult.result === null) {
      this.logger.warn(['Could not stringify old value for hook binding "' + bindingName + '" for component "' + componentName + '" to compare by value. Defaulting to comparison by reference instead.'], options);
      return false;
    }
    if (newResult.result === null) {
      this.logger.warn(['Could not stringify new value for hook binding "' + bindingName + '" for component "' + componentName + '" to compare by value. Defaulting to comparison by reference instead.'], options);
      return false;
    }

    // Max depth reached?
    if (oldResult.depthReachedCount > 0 && newResult.depthReachedCount > 0) {
      this.logger.warn([
        'Maximum compareByValueDepth of ' + options.compareByValueDepth + ' reached ' + newResult.depthReachedCount + ' time(s) for new value and ' + oldResult.depthReachedCount + ' time(s) for old value while comparing binding "' + bindingName + '" for component "' + componentName + '.\n',
        'If this impacts performance, consider simplifying this binding, reducing comparison depth or setting compareInputsByValue/compareOutputsByValue to false.'
      ], options);
    } else if (oldResult.depthReachedCount > 0) {
      this.logger.warn([
        'Maximum compareByValueDepth of ' + options.compareByValueDepth + ' reached ' + oldResult.depthReachedCount + ' time(s) for old value while comparing binding "' + bindingName + '" for component "' + componentName + '.\n',
        'If this impacts performance, consider simplifying this binding, reducing comparison depth or setting compareInputsByValue/compareOutputsByValue to false.',
      ], options);
    } else if (newResult.depthReachedCount > 0) {
      this.logger.warn([
        'Maximum compareByValueDepth of ' + options.compareByValueDepth + ' reached ' + newResult.depthReachedCount + ' time(s) for new value while comparing binding "' + bindingName + '" for component "' + componentName + '.\n',
        'If this impacts performance, consider simplifying this binding, reducing comparison depth or setting compareInputsByValue/compareOutputsByValue to false.',
      ], options);
    }

    return true;
  }
}
