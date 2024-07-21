import { Injectable, reflectComponentType } from '@angular/core';
import { SelectorHookParserConfig, SelectorHookParserConfigDefaults, selectorHookParserConfigDefaults } from './selectorHookParserConfig';

/**
 * A helper class for resolving SelectorHookParserConfig
 */
@Injectable({
  providedIn: 'root'
})
export class SelectorHookParserConfigResolver {

  constructor() {
  }

  /**
   * Overwrites the default parser config with a (partial) SelectorHookParserConfig object and returns the result
   *
   * @param userParserConfig - The (partial) SelectorHookParserConfig object
   */
  processConfig(userParserConfig: SelectorHookParserConfig): SelectorHookParserConfig {
    const parserConfig: SelectorHookParserConfigDefaults = JSON.parse(JSON.stringify(selectorHookParserConfigDefaults));

    // component
    if (!userParserConfig || !userParserConfig.hasOwnProperty('component')) {
      throw Error('Missing the required "component" property for the SelectorHookParserConfig. Must be either the component class or a LazyLoadComponentConfig.');
    }
    parserConfig.component = userParserConfig.component;

    // If is class
    if (userParserConfig.component.hasOwnProperty('prototype')) {
      const compMeta = reflectComponentType(userParserConfig.component as (new(...args: any[]) => any))!;
      parserConfig.selector = compMeta.selector;

    // If is LazyLoadingComponentConfig
    } else if (userParserConfig.component.hasOwnProperty('importPromise') && userParserConfig.component.hasOwnProperty('importName')) {
      if (!userParserConfig.hasOwnProperty('selector')) {
        throw Error(`When using lazy-loaded dynamic components, you have to specify the "selector" property in the parser config, as the real selector can't be known before the component is loaded.`); 
      }
    // If is neither
    } else {
      throw Error('The "component" property in the SelectorHookParserConfig must either contain the component class or a LazyLoadComponentConfig.');
    }

    // name
    if (userParserConfig.hasOwnProperty('name')) {
      if (typeof userParserConfig.name !== 'string') { throw Error('The submitted "name" property in the SelectorHookParserConfig must be of type string, was ' + typeof userParserConfig.name); }
      parserConfig.name = userParserConfig.name;
    }

    // selector (defaults to component selector)
    if (userParserConfig.hasOwnProperty('selector')) {
      if (typeof userParserConfig.selector !== 'string') { throw Error('The submitted "selector" property in the SelectorHookParserConfig must be of type string, was ' + typeof userParserConfig.selector); }
      parserConfig.selector = userParserConfig.selector;
    }

    if (userParserConfig.hasOwnProperty('hostElementTag')) {
      if (typeof userParserConfig.hostElementTag !== 'string') { throw Error('The submitted "hostElementTag" property in the SelectorHookParserConfig must be of type string, was ' + typeof userParserConfig.hostElementTag); }
      parserConfig.hostElementTag = userParserConfig.hostElementTag;
    }

    // injector (defaults to undefined)
    if (userParserConfig.hasOwnProperty('injector')) {
      parserConfig.injector = userParserConfig.injector;
    }

    // environmentInjector (defaults to undefined)
    if (userParserConfig.hasOwnProperty('environmentInjector')) {
      parserConfig.environmentInjector = userParserConfig.environmentInjector;
    }

    // enclosing
    if (userParserConfig.hasOwnProperty('enclosing')) {
      if (typeof userParserConfig.enclosing !== 'boolean') { throw Error('The submitted "enclosing" property in the SelectorHookParserConfig must be of type boolean, was ' + typeof userParserConfig.enclosing); }
      parserConfig.enclosing = userParserConfig.enclosing;
    }

    // bracketStyle
    if (userParserConfig.hasOwnProperty('bracketStyle')) {
      if (typeof userParserConfig.bracketStyle !== 'object' || typeof userParserConfig.bracketStyle.opening !== 'string' || typeof userParserConfig.bracketStyle.closing !== 'string') {
        throw Error('The submitted "bracketStyle" property in the SelectorHookParserConfig must have the form {opening: string, closing: string}');
      }
      parserConfig.bracketStyle = userParserConfig.bracketStyle;
    }

    // unescapeStrings
    if (userParserConfig.hasOwnProperty('unescapeStrings')) {
      if (typeof userParserConfig.unescapeStrings !== 'boolean') { throw Error('The submitted "unescapeStrings" property in the SelectorHookParserConfig must be of type boolean, was ' + typeof userParserConfig.unescapeStrings); }
      parserConfig.unescapeStrings = userParserConfig.unescapeStrings;
    }

    // parseInputs
    if (userParserConfig.hasOwnProperty('parseInputs')) {
      if (typeof userParserConfig.parseInputs !== 'boolean') { throw Error('The submitted "parseInputs" property in the SelectorHookParserConfig must be of type boolean, was ' + typeof userParserConfig.parseInputs); }
      parserConfig.parseInputs = userParserConfig.parseInputs;
    }

    // inputsBlacklist
    if (userParserConfig.hasOwnProperty('inputsBlacklist')) {
      if (!Array.isArray(userParserConfig.inputsBlacklist)) { throw Error('The submitted "inputsBlacklist" property in the SelectorHookParserConfig must be an array of strings.'); }
      for (const entry of userParserConfig.inputsBlacklist) {
        if (typeof entry !== 'string') { throw Error('All entries of the submitted "inputsBlacklist" property in the SelectorHookParserConfig must be of type string, ' + typeof entry + ' found.'); }
      }
      parserConfig.inputsBlacklist = userParserConfig.inputsBlacklist;
    }

    // inputsWhitelist
    if (userParserConfig.hasOwnProperty('inputsWhitelist')) {
      if (!Array.isArray(userParserConfig.inputsWhitelist)) { throw Error('The submitted "inputsWhitelist" property in the SelectorHookParserConfig must be an array of strings.'); }
      for (const entry of userParserConfig.inputsWhitelist) {
        if (typeof entry !== 'string') { throw Error('All entries of the submitted "inputsWhitelist" property in the SelectorHookParserConfig must be of type string, ' + typeof entry + ' found.'); }
      }
      parserConfig.inputsWhitelist = userParserConfig.inputsWhitelist;
    }

    // outputsBlacklist
    if (userParserConfig.hasOwnProperty('outputsBlacklist')) {
      if (!Array.isArray(userParserConfig.outputsBlacklist)) { throw Error('The submitted "outputsBlacklist" property in the SelectorHookParserConfig must be an array of strings.'); }
      for (const entry of userParserConfig.outputsBlacklist) {
        if (typeof entry !== 'string') { throw Error('All entries of the submitted "outputsBlacklist" property in the SelectorHookParserConfig must be of type string, ' + typeof entry + ' found.'); }
      }
      parserConfig.outputsBlacklist = userParserConfig.outputsBlacklist;
    }

    // outputsWhitelist
    if (userParserConfig.hasOwnProperty('outputsWhitelist')) {
      if (!Array.isArray(userParserConfig.outputsWhitelist)) { throw Error('The submitted "outputsWhitelist" property in the SelectorHookParserConfig must be an array of strings.'); }
      for (const entry of userParserConfig.outputsWhitelist) {
        if (typeof entry !== 'string') { throw Error('All entries of the submitted "outputsWhitelist" property in the SelectorHookParserConfig must be of type string, ' + typeof entry + ' found.'); }
      }
      parserConfig.outputsWhitelist = userParserConfig.outputsWhitelist;
    }

    // allowContextInBindings
    if (userParserConfig.hasOwnProperty('allowContextInBindings')) {
      if (typeof userParserConfig.allowContextInBindings !== 'boolean') { throw Error('The submitted "allowContextInBindings" property in the SelectorHookParserConfig must be of type boolean, was ' + typeof userParserConfig.allowContextInBindings); }
      parserConfig.allowContextInBindings = userParserConfig.allowContextInBindings;
    }

    // allowContextFunctionCalls
    if (userParserConfig.hasOwnProperty('allowContextFunctionCalls')) {
      if (typeof userParserConfig.allowContextFunctionCalls !== 'boolean') { throw Error('The submitted "allowContextFunctionCalls" property in the SelectorHookParserConfig must be of type boolean, was ' + typeof userParserConfig.allowContextFunctionCalls); }
      parserConfig.allowContextFunctionCalls = userParserConfig.allowContextFunctionCalls;
    }

    return parserConfig as SelectorHookParserConfig;
  }
}
