import { Injectable, isDevMode } from '@angular/core';

import { regexes } from './regexes';
import { DataTypeEncoder } from './dataTypeEncoder';
import { matchAll } from '../polyfills/matchAll';


/**
 * A parser that can evaluate Javascript data types from strings and turn them into live variables
 */
@Injectable()
export class DataTypeParser {

  constructor(private dataTypeEncoder: DataTypeEncoder) {
  }

  /**
   * Takes a string containing a Javascript data type as it would in code, such a number ('15'), a string ('"hello"'),
   * an array ('[1,2,3]'), an object ('{prop: "something"}') etc., and evaluates it to be an an actual variable.
   *
   * Note: This function works without invoking eval() and instead uses JSON.parse() for the heavy lifting. As such, it should be safe
   * to use and should cover most forms of input.
   *
   * @param dataTypeString - The string to parse
   * @param context - (optional) A context object to load variables from
   * @param event - (optional) An event object to place $event vars with
   * @param unescapeStrings - (optional) Whether to unescape strings or not
   * @param trackContextVariables - (optional) An object that will be filled out with all found context vars
   * @param allowContextFunctionCalls - (optional) Whether to allow function calls in context vars
   */
  evaluateDataTypeFromString(dataTypeString: string, context: {[key: string]: any} = {}, event?: any, unescapeStrings: boolean = true, trackContextVariables: any = {}, allowContextFunctionCalls: boolean = true): any {

    // a) Simple types
    // --------------------
    // null or undefined
    if (dataTypeString === 'null') { return null; }
    if (dataTypeString === 'undefined') { return undefined; }
    // boolean
    if (dataTypeString === 'true') { return true; }
    if (dataTypeString === 'false') { return false; }
    // number
    if (!isNaN(dataTypeString as any))  { return parseInt(dataTypeString, 10); }
    // string
    if (
      (dataTypeString.startsWith('"') && dataTypeString.endsWith('"')) ||
      (dataTypeString.startsWith("'") && dataTypeString.endsWith("'")) ||
      (dataTypeString.startsWith("`") && dataTypeString.endsWith("`"))
    ) {
      // Remove outer quotes, potentially unescape and return
      let decodedString = dataTypeString.substr(1, dataTypeString.length - 2);
      decodedString = unescapeStrings ? this.dataTypeEncoder.stripSlashes(decodedString) : decodedString;
      return decodedString;
    }

    // b) Complex types
    // --------------------
    // IMPORTANT: To properly parse complex object structures as well as context variables with regex, the string needs to be prepared. This means:
    // 1. Substrings must be rendered 'harmless', meaning all special characters that regex might confuse with variable syntax must be encoded.
    // 2. The brackets of subfunctions (e.g. context.fn(otherFn(param)).var), must be encoded as well. Regex can't handle nested substructures and wouldn't know which bracket closes the outer function.
    // 3. The brackets of subbrackets (e.g. context[context['something']].var) must be encoded for the same reason.
    dataTypeString = this.encodeDataTypeString(dataTypeString);

    // array or object literal
    if (
      (dataTypeString.startsWith('{') && dataTypeString.endsWith('}')) ||
      (dataTypeString.startsWith('[') && dataTypeString.endsWith(']'))
    ) {
      // Prepare string and parse as JSON
      const json = this.parseAsJSON(dataTypeString, unescapeStrings);
      // Load variables
      return this.loadVariables(json, context, event, unescapeStrings, trackContextVariables, allowContextFunctionCalls);
    }

    // event variable name
    if (dataTypeString === '$event') {
      return event;
    }

    // context variable name
    if (dataTypeString.match(new RegExp('^\\s*' + regexes.contextVariableRegex + '\\s*$', 'gm'))) {
      return this.safelyLoadContextVariable(dataTypeString, context, event, unescapeStrings, trackContextVariables, allowContextFunctionCalls);
    }

    throw Error('Data type for following input was not recognized and could not be parsed: "' + dataTypeString + '"');
  }

  /**
   * Encodes a data type string
   *
   * @param dataTypeString - The string to encode
   */
  encodeDataTypeString(dataTypeString: string): string {
    dataTypeString = this.dataTypeEncoder.encodeSubstrings(dataTypeString);              // Encode all potential substrings
    dataTypeString = this.dataTypeEncoder.encodeSubfunctions(dataTypeString);            // Encode all potential subfunctions
    dataTypeString = this.dataTypeEncoder.encodeVariableSubbrackets(dataTypeString);     // Encode all potential subbrackets of variables
    return dataTypeString;
  }

  /**
   * Decodes a data type string
   *
   * @param dataTypeString - The string to decode
   */
  decodeDataTypeString(dataTypeString: string): string {
    dataTypeString = this.dataTypeEncoder.decodeStringSpecialChars(dataTypeString);     // Decode special chars from substrings
    dataTypeString = this.dataTypeEncoder.decodeFunctionBrackets(dataTypeString);       // Decode subfunctions
    dataTypeString = this.dataTypeEncoder.decodeVariableBrackets(dataTypeString);       // Decode subbrackets
    dataTypeString = dataTypeString.trim();                                             // Trim whitespace
    return dataTypeString;
  }

  /**
   * In order to successfully parse a data type string with JSON.parse(), it needs to follow certain formatting rules.
   * This functions ensures that these are followed and corrects the input if not.
   *
   * @param JSONString - The string to be given to JSON.parse()
   * @param unescapeStrings - Whether to unescape the strings of this JSON
   */
  parseAsJSON(JSONString: string, unescapeStrings: boolean = true): any {

    // Find all single- and grave-quote-delimited strings and convert them to double quote strings
    const singleQuoteStringRegex = /\'(\\.|[^\'])*?\'/gm;
    JSONString = JSONString.replace(singleQuoteStringRegex, match => {
      return '"' + match.slice(1, -1) + '"';
    });
    const graveQuoteStringRegex = /\`(\\.|[^\`])*?\`/gm;
    JSONString = JSONString.replace(graveQuoteStringRegex, match => {
      return '"' + match.slice(1, -1) + '"';
    });

    // Add double-quotes around JSON property names where still missing
    const JSONPropertyRegex = /"?([a-z0-9A-Z_]+)"?\s*:/g;
    JSONString = JSONString.replace(JSONPropertyRegex, '"$1": ');

    // Prevent setting protected properties
    if (JSONString.match(/"?__proto__"?\s*:/g)) {
      throw Error('Setting the "__proto__" property in a hook input object is not allowed.');
    }
    if (JSONString.match(/"?prototype"?\s*:/g)) {
      throw Error('Setting the "prototype" property in a hook input object is not allowed.');
    }
    if (JSONString.match(/"?constructor"?\s*:/g)) {
      throw Error('Setting the "constructor" property in a hook input object is not allowed.');
    }

    // Replace undefined with null
    JSONString = this.replaceValuesInJSONString(JSONString, 'undefined', match => 'null');

    // Replace context vars with string placeholders
    JSONString = this.replaceValuesInJSONString(JSONString, regexes.contextVariableRegex, (match) => {
      return '"' + this.dataTypeEncoder.transformContextVarIntoPlacerholder(match) + '"';
    });

    // Replace $event with string placeholders
    JSONString = this.replaceValuesInJSONString(JSONString, '\\$event', match => '"__EVENT__"');

    // PARSE
    const json = JSON.parse(JSONString);

    // Decode all strings that are not context vars or the event object
    this.decodeJSONStrings(json, unescapeStrings);

    return json;
  }

  /**
   * Given a stringified json and a json value regex, allows you to replace all occurences
   * of those values in the json via a callback function.
   *
   * IMPORTANT: JSONString must be already encoded via this.encodeDataTypeString() for this to work.
   *
   * @param JSONString - The stringified JSON
   * @param valueRegex - The values to find
   * @param callbackFn - A callback fn that returns what you want to replace them with
   */
  replaceValuesInJSONString(JSONString: string, valueRegex: string, callbackFn: (match: string) => string): string {
    // With lookbehinds (too new for some browsers)
    const withLookBehindsRegex = '(?:' +
      '(?<=:\\s*)' + valueRegex + '(?=\\s*[,}])' + '|' +
      '(?<=[\\[,]\\s*)' + valueRegex + '(?=\\s*[\\],])' +
    ')';

    // Without lookbehinds (make sure to keep the lookaheads, though. This way, the same comma can be the end of one regex and the beginning of the next)
    const regex = '(?:' +
      '(:\\s*)(' + valueRegex + ')(?=\\s*[,}])' + '|' +    // Value in object: ':' followed by value followed by ',' or '}'
      '([\\[,]\\s*)(' + valueRegex + ')(?=\\s*[\\],])' +   // Value in array: '[' or ',' followed by value followed by ',' or ']'
    ')';

    return JSONString.replace(new RegExp(regex, 'gm'), (full, p1, p2, p3, p4) => {
      const startPart = p1 ? p1 : p3;
      const value = p2 ? p2 : p4;
      return startPart + callbackFn(value);
    });
  }

  /**
   * Decodes all 'normal' strings without special meaning in a JSON-like object
   *
   * @param jsonLevel - The current level of parsing
   * @param unescapeStrings - Whether to unescape the decoded strings as well
   */
  decodeJSONStrings(jsonLevel: any, unescapeStrings: boolean = true): void {
    for (const prop in jsonLevel) {
      if (typeof jsonLevel[prop] === 'string') {
        // Ignore var placeholders
        if (jsonLevel[prop] === '__EVENT__"' || jsonLevel[prop].match(new RegExp('^\\s*' + regexes.placeholderContextVariableRegex + '\\s*$', 'gm'))) {
          continue;
        }
        // Otherwise decode string
        let decodedString = this.decodeDataTypeString(jsonLevel[prop]);
        decodedString = unescapeStrings ? this.dataTypeEncoder.stripSlashes(decodedString) : decodedString;
        jsonLevel[prop] = decodedString;
      } else if (typeof jsonLevel[prop] === 'object') {
        this.decodeJSONStrings(jsonLevel[prop], unescapeStrings);
      }
    }
  }

  // Loading variables
  // ----------------------------------------------------------------------------------------------------------------------------------------

  /**
   * Takes a parsed input data type, looks for variable placeholder strings and replaces them with the actual variables
   *
   * IMPORTANT: To correctly find variables, their substrings, subfunction and subbrackets must be encoded (done in evaluateDataTypeFromString())
   *
   * @param input - The input variable to check
   * @param context - The current context object, if any
   * @param event - The current event object, if any
   * @param unescapeStrings - Whether to unescape strings or not
   * @param trackContextVariables - An optional object that will be filled out with all found context vars
   * @param allowContextFunctionCalls - Whether function calls in context vars are allowed
   */
  loadVariables(input: any, context: {[key: string]: any} = {}, event?: any, unescapeStrings: boolean = true, trackContextVariables: any = {}, allowContextFunctionCalls: boolean = true): any {
    const wrapper = {result: input};
    this.loadVariablesLoop(wrapper, context, event, unescapeStrings, trackContextVariables, allowContextFunctionCalls);
    return wrapper.result;
  }

  /**
   * Travels a JSON-like object to find all context vars and event object and replaces them with their actual values
   *
   * @param arrayOrObject - The property of the JSON to analyze
   * @param context - The current context object, if any
   * @param event - The current event object, if any
   * @param unescapeStrings - Whether to unescape strings or not
   * @param trackContextVariables - Whether to unescape strings or not
   * @param allowContextFunctionCalls - Whether function calls in context vars are allowed
   */
  loadVariablesLoop(arrayOrObject: any, context: {[key: string]: any} = {}, event?: any, unescapeStrings: boolean = true, trackContextVariables: any = {}, allowContextFunctionCalls: boolean = true): void {
    for (const prop in arrayOrObject) {
      // Only interested in strings
      if (typeof arrayOrObject[prop] === 'string') {
        // If event placeholder
        if (arrayOrObject[prop] === '__EVENT__') {
          arrayOrObject[prop] = event;
        } else
        // If context var placeholder
        if (arrayOrObject[prop].match(new RegExp('^\\s*' + regexes.placeholderContextVariableRegex + '\\s*$', 'gm'))) {
          const contextVar = this.dataTypeEncoder.transformPlaceholderIntoContextVar(arrayOrObject[prop].trim());
          arrayOrObject[prop] = this.safelyLoadContextVariable(contextVar, context, event, unescapeStrings, trackContextVariables, allowContextFunctionCalls);
        }
      } else if (typeof arrayOrObject[prop] === 'object') {
        this.loadVariablesLoop(arrayOrObject[prop], context, event, unescapeStrings, trackContextVariables);
      }
    }
  }

  /**
   * A safe wrapper around the loadContextVariable function. Returns undefined if there is any error.
   *
   * @param contextVar - The context var
   * @param context - The context object
   * @param event - An event object, if available
   * @param unescapeStrings - Whether to unescape strings or not
   * @param trackContextVariables - An optional object that will be filled out with all found context vars
   * @param allowContextFunctionCalls - Whether function calls in context vars are allowed
   */
  safelyLoadContextVariable(contextVar: string, context: {[key: string]: any} = {}, event?: any, unescapeStrings: boolean = true, trackContextVariables: any = {}, allowContextFunctionCalls: boolean = true): any {
    try {
      const resolvedContextVariable = this.loadContextVariable(contextVar, context, event, unescapeStrings, trackContextVariables, allowContextFunctionCalls);
      trackContextVariables[this.decodeDataTypeString(contextVar)] = resolvedContextVariable;
      return resolvedContextVariable;
    } catch (e) {
      if (isDevMode()) {
        console.warn(e);
      }
      trackContextVariables[this.decodeDataTypeString(contextVar)] = undefined;
      return undefined;
    }
  }

  /**
   * Takes a context variable string and evaluates it to get the desired value
   *
   * IMPORTANT: To correctly parse variables, their substrings, subfunction and subbrackets must be encoded (done in evaluateDataTypeFromString())
   *
   * @param contextVar - The context var
   * @param context - The context object
   * @param event - An event object, if available
   * @param unescapeStrings - Whether to unescape strings or not
   * @param trackContextVariables - An optional object that will be filled out with all found context vars
   * @param allowContextFunctionCalls - Whether function calls in context vars are allowed
   */
  loadContextVariable(contextVar: string, context: {[key: string]: any} = {}, event?: any, unescapeStrings: boolean = true, trackContextVariables: any = {}, allowContextFunctionCalls: boolean = true): any {
    const shortContextVar = contextVar.substr(7);  // Cut off 'context' from the front

    // If context object is requested directly
    if (shortContextVar.trim() === '') {
      return context;
    }

    // Otherwise, create variable path array and fetch value, so the context object can be easily traveled.
    // Variable path example: 'restaurants["newOrleans"].reviews[5]' becomes ['restaurants', 'newOrleans', 'reviews', 5],
    const path = [];
    const pathMatches = matchAll(shortContextVar, new RegExp(regexes.variablePathPartRegex, 'gm'));
    for (const match of pathMatches) {

      // 1. If dot notation
      if (match[0].startsWith('.')) {
        path.push({
          type: 'property',
          value: match[0].substr(1)
        });
      }

      // 2. If bracket notation
      if (match[0].startsWith('[') && match[0].endsWith(']')) {
        let bracketValue = match[0].substr(1, match[0].length - 2);

        // Evaluate bracket parameter
        bracketValue = this.decodeDataTypeString(bracketValue);                                                                                             // Decode variable
        bracketValue = this.evaluateDataTypeFromString(bracketValue, context, event, unescapeStrings, trackContextVariables, allowContextFunctionCalls);    // Recursively repeat the process
        path.push({
          type: 'property',
          value: bracketValue
        });
      }

      // 3. If function call
      if (match[0].startsWith('(') && match[0].endsWith(')')) {
        // Check if function calls are allowed
        if (!allowContextFunctionCalls) {
          throw Error('Tried to call a function in a context variable. This has been disallowed in the current config.');
        }

        const funcParams = match[0].substr(1, match[0].length - 2);  // Strip outer brackets
        // Evaluate function parameters
        const paramsArray = [];
        if (funcParams !== '') {
          for (const param of funcParams.split(',')) {
            let p = this.decodeDataTypeString(param);                                                                                     // Decode variable
            p = this.evaluateDataTypeFromString(p, context, event, unescapeStrings, trackContextVariables, allowContextFunctionCalls);    // Recursively repeat the process
            paramsArray.push(p);
          }
        }
        // Add function to path
        path.push({
          type: 'function',
          value: paramsArray
        });
      }
    }

    try {
      return this.fetchContextVariable(context, JSON.parse(JSON.stringify(path)));
    } catch (e) {
      if (isDevMode()) {
        console.warn(e);
      }
      throw Error('The required context variable "' + this.decodeDataTypeString(contextVar) + '" could not be found in the context object. Returning undefined instead.');
    }
  }

  /**
   * Recursively travels an object with the help of a path array and returns the specified value,
   * or undefined if not found
   *
   * @param contextLevel - The object to travel
   * @param path - The property path array
   */
  fetchContextVariable(contextLevel: any, path: Array<any>): any {
    // Prevent accessing protected properties
    if (path[0].value ===  '__proto__') {
      throw Error('Accessing the __proto__ property through a context variable is not allowed.');
    }
    if (path[0].value ===  'prototype') {
      throw Error('Accessing the prototype property through a context variable is not allowed.');
    }
    if (path[0].value ===  'constructor') {
      throw Error('Accessing the constructor property through a context variable is not allowed.');
    }

    if (contextLevel === undefined) {
      throw Error('Context variable path could not be resolved. Trying to access ' + (path[0].type === 'property' ? 'property "' + path[0].value + '" of undefined.' : 'undefined function.'));
    }

    // Get property
    let result;
    if (path[0].type === 'property') {
      if (contextLevel.hasOwnProperty(path[0].value)) {
        result = contextLevel[path[0].value];
        // It makes a difference to JavaScript whether you call a function by 'obj.func()' or by 'let func = obj.func; func();'
        // In the latter case, 'this' will be undefined and not point to the parent. Since this recursive approach uses that latter version,
        // manually bind each function to the parent to restore the normal behavior.
        // Also: If the user has submitted a bound function himself, calling .bind here again does nothing, which is the desired behaviour.
        if (typeof result === 'function') {
          result = result.bind(contextLevel);
        }
      // Check '__proto__' as well as functions tend to live here instead of directly on the instance
      } else if (contextLevel.__proto__.hasOwnProperty(path[0].value))  {
        result = contextLevel.__proto__[path[0].value];
        if (typeof result === 'function') {
          result = result.bind(contextLevel);
        }
      } else {
        result = undefined;
      }
    } else if (path[0].type === 'function') {
      result = contextLevel(...path[0].value);
    }
    path.shift();

    // Recursively travel path
    if (path.length > 0) {
      result = this.fetchContextVariable(result, path);
    }
    return result;
  }

}
