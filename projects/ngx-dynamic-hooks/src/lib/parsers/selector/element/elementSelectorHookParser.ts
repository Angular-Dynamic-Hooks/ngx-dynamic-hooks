import { RichBindingData, SavedBindings } from '../../../interfaces';
import { HookParser, HookValue, HookComponentData, HookBindings } from '../../../interfacesPublic';
import { BindingsValueManager } from '../bindingsValueManager';
import { SelectorHookParserConfig } from '../selectorHookParserConfig';
import { SelectorHookParserConfigResolver } from '../selectorHookParserConfigResolver';
import { AutoPlatformService } from '../../../services/platform/autoPlatformService';

/**
 * A powerful parser for standard Angular component selectors that comes with this library
 */
export class ElementSelectorHookParser implements HookParser {
  name: string|undefined;
  config: SelectorHookParserConfig;
  savedBindings: {[key: number]: SavedBindings} = {};

  constructor(config: SelectorHookParserConfig, private configResolver: SelectorHookParserConfigResolver, private platformService: AutoPlatformService, private bindingsValueManager: BindingsValueManager) {
    this.config = this.configResolver.processConfig(config);
    this.name = this.config.name;
  }

  public findHookElements(contentElement: any, context: any): any[] {
    return Array.from(this.platformService.querySelectorAll(contentElement, this.config.selector!));
  }

  public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: any[]): HookComponentData {

    // Always scrub potential []-input- and ()-output-attrs from anchor elements 
    this.scrubAngularBindingAttrs(hookValue.element);

    return {
      component: this.config.component,
      hostElementTag: this.config.hostElementTag,
      injector: this.config.injector,
      environmentInjector: this.config.environmentInjector
    };
  }

  public getBindings(hookId: number, hookValue: HookValue, context: any): HookBindings {
    let hookBindings = this.savedBindings[hookId];

    // Parse bindings once from hookValue, then reuse on subsequent runs (raw values will never change as hookValue.element is a snapshot)
    if (hookBindings === undefined) {
      hookBindings = this.createBindings(hookValue.elementSnapshot!);
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

    /**
   * Always removes angular-typical template attrs like []-input and ()-outputs from anchors
   *
   * @param anchorElement - The element to strub
   */
  scrubAngularBindingAttrs(anchorElement: any) {
    const attrsToScrub = Array.from(anchorElement.attributes)
      .map((attrObj: any) => attrObj.name)
      .filter((attr: string) => 
        (attr.startsWith('[') && attr.endsWith(']')) ||
        (attr.startsWith('(') && attr.endsWith(')'))
      );

    for (const attr of attrsToScrub) {
      this.platformService.removeAttribute(anchorElement, attr);
    }
  }

  createBindings(element: any): SavedBindings {
    const rawInputs = this.collectRawBindings(element!, 'inputs', this.config.inputsBlacklist || null, this.config.inputsWhitelist || null);
    const inputBindings: {[key: string]: RichBindingData} = {};
    for (const [rawInputKey, rawInputValue] of Object.entries(rawInputs)) {
      inputBindings[rawInputKey] = {raw: rawInputValue, parsed: false, value: null, boundContextVariables: {}};
    }

    const rawOutputs = this.collectRawBindings(element!, 'outputs', this.config.outputsBlacklist || null, this.config.outputsWhitelist || null);
    const outputBindings: {[key: string]: RichBindingData} = {};
    for (const [rawOutputKey, rawOutputValue] of Object.entries(rawOutputs)) {
      outputBindings[rawOutputKey] = {raw: rawOutputValue, parsed: false, value: null, boundContextVariables: {}};
    }

    return {
      inputs: inputBindings,
      outputs: outputBindings
    };
  }

  collectRawBindings (element: any, type: 'inputs'|'outputs', blacklist: string[]|null, whitelist: string[]|null): {[key: string]: any} {
    const bindings: {[key: string]: any} = {};

    // Collect raw bindings
    const attrNames = this.platformService.getAttributeNames(element);
    for (let attrName of attrNames) {
      if (
        type === 'inputs' && (!attrName.startsWith('(') || !attrName.endsWith(')')) ||
        type === 'outputs' && (attrName.startsWith('(') && attrName.endsWith(')'))
      ) {
        let binding: any = this.platformService.getAttribute(element, attrName);

        // If input has []-brackets: Transform empty attr to undefined
        if (type === 'inputs' && attrName.startsWith('[') && attrName.endsWith(']') && binding === '') {
          binding = undefined;
        }

        // If input has no []-brackets: Should be interpreted as plain strings, so wrap in quotes
        if (type === 'inputs' && (!attrName.startsWith('[') || !attrName.endsWith(']'))) {
          binding = `'${binding}'`;
        }

        // Trim [] and () brackets from attr name
        attrName = attrName.replace(/^\[|^\(|\]$|\)$/g, '');

        bindings[attrName] = binding;
      }
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
