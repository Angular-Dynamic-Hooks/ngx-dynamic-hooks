import { RichBindingData } from '../../interfaces';
import { HookParser, HookPosition, HookValue, HookComponentData, HookBindings } from '../../interfacesPublic';
import { TagHookFinder } from './services/tagHookFinder';
import { BindingStateManager } from './services/bindingStateManager';
import { SelectorHookParserConfig } from './config/selectorHookParserConfig';
import { SelectorHookParserConfigResolver } from './config/selectorHookParserConfigResolver';

/**
 * A powerful parser for standard Angular component selectors that comes with this library
 */
export class SelectorHookParser implements HookParser {
  name: string|undefined;
  config: SelectorHookParserConfig;
  // Keep track of all hooks and their current bindings to keep references on updates
  currentBindings: {[key: number]: {
      inputs?: {[key: string]: RichBindingData};
      outputs?: {[key: string]: RichBindingData};
    }
  } = {};

  constructor(config: SelectorHookParserConfig, private configResolver: SelectorHookParserConfigResolver, private tagHookFinder: TagHookFinder, private bindingStateManager: BindingStateManager) {
    this.config = this.configResolver.processConfig(config);
    this.name = this.config.name;
  }

  // Main parser functions
  // --------------------------------------------------------------------------

  public findHooks(content: string, context: any): Array<HookPosition> {
    return this.config.enclosing ?
      this.tagHookFinder.findEnclosingTags(content, this.config.selector!, this.config.bracketStyle) :
      this.tagHookFinder.findStandaloneTags(content, this.config.selector!, this.config.bracketStyle);
  }

  public loadComponent(hookId: number, hookValue: HookValue, context: any, childNodes: Element[]): HookComponentData {
    return {
      component: this.config.component,
      injector: this.config.injector,
      environmentInjector: this.config.environmentInjector
    };
  }

  public getBindings(hookId: number, hookValue: HookValue, context: any): HookBindings {
    if (!this.currentBindings.hasOwnProperty(hookId)) {
      this.currentBindings[hookId] = {};
    }

    // Store the bindings for each hook to preserve references in between updates
    const hookBindings = this.currentBindings[hookId];
    hookBindings.inputs = this.bindingStateManager.getCurrentInputBindings(hookValue.openingTag!, context, this.config, hookBindings.inputs);
    hookBindings.outputs = this.bindingStateManager.getCurrentOutputBindings(hookValue.openingTag!, this.config, hookBindings.outputs);

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
    const result: {[key: string]: any} = {};
    for (const [key, value] of Object.entries(richBindingsObject)) {
      result[key] = value.value;
    }
    return result;
  }
}
