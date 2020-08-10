import { RichBindingData } from '../../interfaces';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings } from '../../interfacesPublic';
import { GenericSelectorFinder } from './services/genericSelectorFinder';
import { BindingStateManager } from './services/bindingStateManager';
import { GenericSelectorParserConfig } from './config/parserConfig';
import { ParserConfigResolver } from './config/parserConfigResolver';

/**
 * A powerful parser for standard Angular component selectors that comes with this library
 */
export class GenericSelectorParser implements HookParser {
  name: string;
  config: GenericSelectorParserConfig;
  // Keep track of all hooks and their current bindings to keep references on updates
  currentBindings: {[key: number]: {
      inputs?: {[key: string]: RichBindingData};
      outputs?: {[key: string]: RichBindingData};
    }
  } = {};

  constructor(config: GenericSelectorParserConfig, private parserConfigResolver: ParserConfigResolver, private genericSelectorFinder: GenericSelectorFinder, private bindingStateManager: BindingStateManager) {
    this.config = this.parserConfigResolver.processConfig(config);
    this.name = this.config.name;
  }

  // Main parser functions
  // --------------------------------------------------------------------------

  public findHooks(text: string, context: {[key: string]: any}): Array<HookPosition> {
    return this.config.multiTag ?
      this.genericSelectorFinder.findMultiTagSelectors(text, this.config.selector, this.config.bracketStyle) :
      this.genericSelectorFinder.findSingleTagSelectors(text, this.config.selector, this.config.bracketStyle);
  }

  public loadHook(hookId: number, hookValue: HookValue, context: {[key: string]: any}, childNodes: Array<Element>): HookComponentData {
    return {
      component: this.config.component,
      injector: this.config.injector
    };
  }

  public updateBindings(hookId: number, hookValue: HookValue, context: {[key: string]: any}): HookBindings {
    if (!this.currentBindings.hasOwnProperty(hookId)) {
      this.currentBindings[hookId] = {};
    }

    const hookBindings = this.currentBindings[hookId];
    hookBindings.inputs = this.bindingStateManager.getCurrentInputBindings(hookValue.openingTag, context, this.config, hookBindings.inputs);
    hookBindings.outputs = this.bindingStateManager.getCurrentOutputBindings(hookValue.openingTag, this.config, hookBindings.outputs);

    return {
      inputs: this.getValuesFromBindings(hookBindings.inputs),
      outputs: this.getValuesFromBindings(hookBindings.outputs)
    };
  }


  // --------------------------------------------------------------------------

  /**
   * Transforms a RichBindingData object into a normal bindings object
   *
   * @param richBindingsObject - The object containing the RichBindingData
   */
  private getValuesFromBindings(richBindingsObject: {[key: string]: RichBindingData}): {[key: string]: any} {
    const result = {};
    for (const [key, value] of Object.entries(richBindingsObject)) {
      result[key] = value.value;
    }
    return result;
  }
}
