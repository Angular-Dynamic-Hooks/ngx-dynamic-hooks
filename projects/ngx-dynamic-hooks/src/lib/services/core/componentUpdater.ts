import { SimpleChange, isDevMode, Injectable, reflectComponentType} from '@angular/core';
import { Observable } from 'rxjs';

import { Hook, HookBindings, HookIndex, PreviousHookBinding } from '../../interfacesPublic';
import { OutletOptions } from '../../services/settings/options';
import { DeepComparer, DetailedStringifyResult } from '../utils/deepComparer';

/**
 * The service responsible for updating dynamically created components
 */
@Injectable({
  providedIn: 'root'
})
export class ComponentUpdater {

  constructor(private deepComparer: DeepComparer) {
  }

  /**
   * Invoked when the inputs/outputs should be checked for updates
   *
   * @param hookIndex - The current hookIndex
   * @param context - The new context object
   * @param options - The current OutletOptions
   * @param triggerOnDynamicChanges - Whether to trigger the OnDynamicChanges method of dynamically loaded components
   */
  refresh(hookIndex: HookIndex, context: any, options: OutletOptions, triggerOnDynamicChanges: boolean): void {

    for (const [hookId, hook] of Object.entries(hookIndex)) {
      if (!hook.componentRef) { 
        return; 
      }

      // Save previous bindings
      hook.previousBindings = {
        inputs: this.savePreviousBindings(hook, 'inputs', options.compareInputsByValue!, options.compareByValueDepth!),
        outputs: this.savePreviousBindings(hook, 'outputs', options.compareOutputsByValue!, options.compareByValueDepth!)
      };

      // Update bindings
      hook.bindings = hook.parser.getBindings(hook.id, hook.value, context);
      this.updateComponentWithNewOutputs(hook, context, options);
      this.updateComponentWithNewInputs(hook, options);
    }

    // If context has changed by reference, call OnDynamicChanges() for all created components.
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
   * Processes a hook object and (re)subscribes the outputs of a dynamic component where required
   *
   * @param hook - The hook in question
   * @param context - The current context object
   * @param options - The current HookComponentOptions
   */
  updateComponentWithNewOutputs(hook: Hook, context: any, options: OutletOptions): void {
    const component = hook.componentRef!.instance;

    // Find out which outputs have changed
    const changedOutputs: {[key: string]: (e: any, c: any) => any} = this.getChangedBindings(hook, 'outputs', options.compareOutputsByValue!, options.compareByValueDepth!);

    // Check if outputs exist on component
    const existingOutputs: {[key: string]: (e: any, c: any) => any} = {};
    if (options.acceptOutputsForAnyObservable) {
      for (const [outputName, outputCallback] of Object.entries(changedOutputs)) {
        let foundOutputProp = 
          Object.getOwnPropertyNames(component).find(propName => component[propName] instanceof Observable && outputName === propName) ||
          Object.getOwnPropertyNames(component).find(propName => component[propName] instanceof Observable && outputName.toLowerCase() === propName.toLowerCase());
      
        if (foundOutputProp) {
          existingOutputs[foundOutputProp] = outputCallback;
        }
      }
    } else {
      const compMeta = reflectComponentType(hook.componentRef!.componentType)!;
      for (const [outputName, outputCallback] of Object.entries(changedOutputs)) {
        let outputEntry = 
          compMeta.outputs.find(outputObject => outputName === (options.ignoreOutputAliases ? outputObject.propName : outputObject.templateName)) ||
          compMeta.outputs.find(outputObject => outputName.toLowerCase() === (options.ignoreOutputAliases ? outputObject.propName.toLowerCase() : outputObject.templateName.toLowerCase()));

        if (outputEntry) {
          // Save in existingInputs with actual property name, not alias
          existingOutputs[outputEntry.propName] = outputCallback;
        }
      }
    }

    // (Re)subscribe to outputs, store subscription in Hook
    for (const [outputName, outputCallback] of Object.entries(existingOutputs)) {
      if (hook.outputSubscriptions[outputName]) { hook.outputSubscriptions[outputName].unsubscribe(); }
      hook.outputSubscriptions[outputName] = hook.componentRef!.instance[outputName].subscribe((event: any) => outputCallback(event, context));
    }
  }

  /**
   * Processes a hook object and updates the inputs of a dynamic component where required
   *
   * @param hook - The hook in question
   * @param options - The current HookComponentOptions
   */
  updateComponentWithNewInputs(hook: Hook, options: OutletOptions): void {
    const component = hook.componentRef!.instance;

    // Find out which inputs have changed
    const changedInputs = this.getChangedBindings(hook, 'inputs', options.compareInputsByValue!, options.compareByValueDepth!);

    // Check if inputs exists on component
    const existingInputs: {[key: string]: any} = {};
    if (options.acceptInputsForAnyProperty) {
      for (const [inputName, inputValue] of Object.entries(changedInputs)) {
        let foundInputProp = 
          Object.getOwnPropertyNames(component).find(propName => component[propName] instanceof Observable && inputName === propName) ||
          Object.getOwnPropertyNames(component).find(propName => component[propName] instanceof Observable && inputName.toLowerCase() === propName.toLowerCase());
      
        // If property exists (in a case-agnostic way), use it. Otherwise create literal new property.
        const finalInputProp = foundInputProp || inputName;

        // Even this setting has limits. Don't allow setting fundamental JavaScript object properties.
        if (!['__proto__', 'prototype', 'constructor'].includes(finalInputProp)) {
          existingInputs[finalInputProp] = inputValue;
        } else {
          console.error('Tried to overwrite a __proto__, prototype or constructor property with input "' + finalInputProp + '" for hook "' + hook.componentRef!.componentType.name + '". This is not allowed.');
          continue;
        }
      }
    } else {
      const compMeta = reflectComponentType(hook.componentRef!.componentType)!;
      for (const [inputName, inputValue] of Object.entries(changedInputs)) {
        let inputEntry = 
          compMeta.inputs.find(inputObject => inputName === (options.ignoreInputAliases ? inputObject.propName : inputObject.templateName)) ||
          compMeta.inputs.find(inputObject => inputName.toLowerCase() === (options.ignoreOutputAliases ? inputObject.propName.toLowerCase() : inputObject.templateName.toLowerCase()));

        if (inputEntry) {
          // Save in existingInputs with actual property name, not alias
          existingInputs[inputEntry.propName] = inputValue;
        }
      }
    }

    // Pass in Inputs, create SimpleChanges object
    const simpleChanges: {[key: string]: SimpleChange} = {};
    for (const [inputName, inputValue] of Object.entries(existingInputs)) {
      hook.componentRef!.instance[inputName] = inputValue;
      const previousValue = hook.previousBindings && hook.previousBindings.inputs.hasOwnProperty(inputName) ? hook.previousBindings.inputs[inputName].reference : undefined;
      simpleChanges[inputName] = new SimpleChange(previousValue, inputValue, !hook.dirtyInputs.has(inputName));
      hook.dirtyInputs.add(inputName);
    }

    // Call ngOnChanges()
    if (Object.keys(simpleChanges).length > 0 && typeof hook.componentRef!.instance['ngOnChanges'] === 'function') {
      hook.componentRef!.instance.ngOnChanges(simpleChanges);
    }
  }

  /**
   * Compares hookData with prevHookData and finds all bindings that have changed
   *
   * @param hook - The hook in question
   * @param type - What kind of binding to check
   * @param compareByValue - Whether to compare by reference or value
   */
  getChangedBindings(hook: Hook, type: 'inputs'|'outputs', compareByValue: boolean, compareDepth: number): {[key: string]: any} {
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
        if (!compareByValue) {
          if (binding !== hook.previousBindings[type][key].reference) {
            changedBindings[key] = binding;
          }
        // b) By value
        } else {
          const stringifiedBinding = this.deepComparer.detailedStringify(binding, compareDepth);
          const canBeComparedByValue = this.checkDetailedStringifyResultPair(key, hook.componentRef!.componentType.name, compareDepth, hook.previousBindings[type][key].stringified!, stringifiedBinding);

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
   * @param compareDepth - The current compareDepth
   * @param oldResult - The detailedStringifiedResult for the old value
   * @param newResult - The detailedStringifiedResult for the new value
   */
  checkDetailedStringifyResultPair(bindingName: string, componentName: string, compareDepth: number, oldResult: DetailedStringifyResult, newResult: DetailedStringifyResult): boolean {
    // Stringify successful?
    if (oldResult.result === null && newResult.result === null) {
      if (isDevMode()) {
        console.warn('Could stringify neither new nor old value for hook binding "' + bindingName + '" for component "' + componentName + '" to compare by value. Defaulting to comparison by reference instead.');
        return false;
      }
    }
    if (oldResult.result === null) {
      if (isDevMode()) {
        console.warn('Could not stringify old value for hook binding "' + bindingName + '" for component "' + componentName + '" to compare by value. Defaulting to comparison by reference instead.');
        return false;
      }
    }
    if (newResult.result === null) {
      if (isDevMode()) {
        console.warn('Could not stringify new value for hook binding "' + bindingName + '" for component "' + componentName + '" to compare by value. Defaulting to comparison by reference instead.');
        return false;
      }
    }

    // Max depth reached?
    if (oldResult.depthReachedCount > 0 && newResult.depthReachedCount > 0) {
      if (isDevMode()) {
        console.warn(
          'Maximum compareByValueDepth of ' + compareDepth + ' reached ' + newResult.depthReachedCount + ' time(s) for new value and ' + oldResult.depthReachedCount + ' time(s) for old value while comparing binding "' + bindingName + '" for component "' + componentName + '.\n',
          'If this impacts performance, consider simplifying this binding, reducing comparison depth or setting compareInputsByValue/compareOutputsByValue to false.'
        );
      }
    } else if (oldResult.depthReachedCount > 0) {
      if (isDevMode()) {
        console.warn(
          'Maximum compareByValueDepth of ' + compareDepth + ' reached ' + oldResult.depthReachedCount + ' time(s) for old value while comparing binding "' + bindingName + '" for component "' + componentName + '.\n',
          'If this impacts performance, consider simplifying this binding, reducing comparison depth or setting compareInputsByValue/compareOutputsByValue to false.',
        );
      }
    } else if (newResult.depthReachedCount > 0) {
      if (isDevMode()) {
        console.warn(
          'Maximum compareByValueDepth of ' + compareDepth + ' reached ' + newResult.depthReachedCount + ' time(s) for new value while comparing binding "' + bindingName + '" for component "' + componentName + '.\n',
          'If this impacts performance, consider simplifying this binding, reducing comparison depth or setting compareInputsByValue/compareOutputsByValue to false.',
        );
      }
    }

    return true;
  }
}
