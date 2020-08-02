import { Injectable, ComponentFactoryResolver } from '@angular/core';
import { GenericSelectorParserConfig, genericSelectorParserConfigDefaults } from './parserConfig';
import { LazyLoadComponentConfig } from '../../../interfacesPublic';

@Injectable({
  providedIn: 'root',
})
export class ParserConfigResolver {

  constructor(private cfr: ComponentFactoryResolver) {
  }

  processConfig(userParserConfig: GenericSelectorParserConfig): GenericSelectorParserConfig {
    const parserConfig = JSON.parse(JSON.stringify(genericSelectorParserConfigDefaults));

    // component
    if (!userParserConfig || !userParserConfig.hasOwnProperty('component')) {
      throw Error('DynCompHooks: Missing the required "component" property for the GenericSelectorParser config. Must be either the component class or a LazyLoadComponentConfig.');
    }
    parserConfig.component = userParserConfig.component;

    // If is class
    if (userParserConfig.component.hasOwnProperty('prototype')) {
      parserConfig.name = (userParserConfig.component as (new(...args: any[]) => any)).name + 'Parser';
      parserConfig.selector = this.cfr.resolveComponentFactory(userParserConfig.component as (new(...args: any[]) => any)).selector;

    // If is LazyLoadingComponentConfig
    } else if (userParserConfig.component.hasOwnProperty('importPromise') && userParserConfig.component.hasOwnProperty('importName')) {
      if (!userParserConfig.hasOwnProperty('selector')) { throw Error(`DynCompHooks: When using lazy-loaded dynamic components, you have to specify the "selector" property in the parser config (that will be used to find it in the text), as the real selector can't be known before the component is loaded.`); }
      parserConfig.name = (userParserConfig.component as LazyLoadComponentConfig).importName + 'Parser';

    } else {
      throw Error('DynCompHooks: The "component" property for the GenericSelectorParser must either contain the component class or a LazyLoadComponentConfig.');
    }

    // name
    if (userParserConfig.hasOwnProperty('name')) {
      if (typeof userParserConfig.name !== 'string') { throw Error('DynCompHooks: The submitted "name" property for the GenericSelectorParser must be of type string, was ' + typeof userParserConfig.name); }
      parserConfig.name = userParserConfig.name;
    }

    // selector (defaults to component selector)
    if (userParserConfig.hasOwnProperty('selector')) {
      if (typeof userParserConfig.selector !== 'string') { throw Error('DynCompHooks: The submitted "selector" property for the GenericSelectorParser must be of type string, was ' + typeof userParserConfig.selector); }
      parserConfig.selector = userParserConfig.selector;
    }

    // injector (defaults to undefined)
    if (userParserConfig.hasOwnProperty('injector')) {
      parserConfig.injector = userParserConfig.injector;
    }

    // multiTag
    if (userParserConfig.hasOwnProperty('multiTag')) {
      if (typeof userParserConfig.multiTag !== 'boolean') { throw Error('DynCompHooks: The submitted "multiTag" property for the GenericSelectorParser must be of type boolean, was ' + typeof userParserConfig.multiTag); }
      parserConfig.multiTag = userParserConfig.multiTag;
    }

    // bracketStyle
    if (userParserConfig.hasOwnProperty('bracketStyle')) {
      if (typeof userParserConfig.bracketStyle !== 'object' || typeof userParserConfig.bracketStyle.opening !== 'string' || typeof userParserConfig.bracketStyle.closing !== 'string') {
        throw Error('DynCompHooks: The submitted "bracketStyle" property for the GenericSelectorParser must have the form {opening: string, closing: string}');
      }
      parserConfig.bracketStyle = userParserConfig.bracketStyle;
    }

    // unescapeStrings
    if (userParserConfig.hasOwnProperty('unescapeStrings')) {
      if (typeof userParserConfig.unescapeStrings !== 'boolean') { throw Error('DynCompHooks: The submitted "unescapeStrings" property for the GenericSelectorParser must be of type boolean, was ' + typeof userParserConfig.unescapeStrings); }
      parserConfig.unescapeStrings = userParserConfig.unescapeStrings;
    }

    // parseInputs
    if (userParserConfig.hasOwnProperty('parseInputs')) {
      if (typeof userParserConfig.parseInputs !== 'boolean') { throw Error('DynCompHooks: The submitted "parseInputs" property for the GenericSelectorParser must be of type boolean, was ' + typeof userParserConfig.parseInputs); }
      parserConfig.parseInputs = userParserConfig.parseInputs;
    }

    // inputsBlacklist
    if (userParserConfig.hasOwnProperty('inputsBlacklist')) {
      if (!Array.isArray(userParserConfig.inputsBlacklist)) { throw Error('DynCompHooks: The submitted "inputsBlacklist" property for the GenericSelectorParser must be an array of strings.'); }
      for (const entry of userParserConfig.inputsBlacklist) {
        if (typeof entry !== 'string') { throw Error('DynCompHooks: All entries of the submitted "inputsBlacklist" property for the GenericSelectorParser must be of type string, ' + typeof entry + 'found.'); }
      }
      parserConfig.inputsBlacklist = userParserConfig.inputsBlacklist;
    }

    // inputsWhitelist
    if (userParserConfig.hasOwnProperty('inputsWhitelist')) {
      if (!Array.isArray(userParserConfig.inputsWhitelist)) { throw Error('DynCompHooks: The submitted "inputsWhitelist" property for the GenericSelectorParser must be an array of strings.'); }
      for (const entry of userParserConfig.inputsWhitelist) {
        if (typeof entry !== 'string') { throw Error('DynCompHooks: All entries of the submitted "inputsWhitelist" property for the GenericSelectorParser must be of type string, ' + typeof entry + 'found.'); }
      }
      parserConfig.inputsWhitelist = userParserConfig.inputsWhitelist;
    }

    // outputsBlacklist
    if (userParserConfig.hasOwnProperty('outputsBlacklist')) {
      if (!Array.isArray(userParserConfig.outputsBlacklist)) { throw Error('DynCompHooks: The submitted "outputsBlacklist" property for the GenericSelectorParser must be an array of strings.'); }
      for (const entry of userParserConfig.outputsBlacklist) {
        if (typeof entry !== 'string') { throw Error('DynCompHooks: All entries of the submitted "outputsBlacklist" property for the GenericSelectorParser must be of type string, ' + typeof entry + 'found.'); }
      }
      parserConfig.outputsBlacklist = userParserConfig.outputsBlacklist;
    }

    // outputsWhitelist
    if (userParserConfig.hasOwnProperty('outputsWhitelist')) {
      if (!Array.isArray(userParserConfig.outputsWhitelist)) { throw Error('DynCompHooks: The submitted "outputsWhitelist" property for the GenericSelectorParser must be an array of strings.'); }
      for (const entry of userParserConfig.outputsWhitelist) {
        if (typeof entry !== 'string') { throw Error('DynCompHooks: All entries of the submitted "outputsWhitelist" property for the GenericSelectorParser must be of type string, ' + typeof entry + 'found.'); }
      }
      parserConfig.outputsWhitelist = userParserConfig.outputsWhitelist;
    }

    // allowContextInBindings
    if (userParserConfig.hasOwnProperty('allowContextInBindings')) {
      if (typeof userParserConfig.allowContextInBindings !== 'boolean') { throw Error('DynCompHooks: The submitted "allowContextInBindings" property for the GenericSelectorParser must be of type boolean, was ' + typeof userParserConfig.allowContextInBindings); }
      parserConfig.allowContextInBindings = userParserConfig.allowContextInBindings;
    }

    // allowContextFunctionCalls
    if (userParserConfig.hasOwnProperty('allowContextFunctionCalls')) {
      if (typeof userParserConfig.allowContextFunctionCalls !== 'boolean') { throw Error('DynCompHooks: The submitted "allowContextFunctionCalls" property for the GenericSelectorParser must be of type boolean, was ' + typeof userParserConfig.allowContextFunctionCalls); }
      parserConfig.allowContextFunctionCalls = userParserConfig.allowContextFunctionCalls;
    }

    return parserConfig;
  }
}
