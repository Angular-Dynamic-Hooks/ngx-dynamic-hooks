import { Logger } from '../../lib/services/utils/logger';
import { DataTypeEncoder, DataTypeParser, getParseOptionDefaults } from '../testing-api';

/**
 * DataTypeParser tests
 */
describe('DataTypeParser', () => {
  let dataTypeParser: DataTypeParser;

  beforeEach(() => { dataTypeParser = new DataTypeParser(new DataTypeEncoder(), new Logger('browser')); });

  it('#should throw an error if trying to parse a JSON with forbidden properties', () => {
    expect(() => dataTypeParser['parseAsJSON']('{__proto__: false}', true))
      .toThrow(new Error('Setting the "__proto__" property in a hook input object is not allowed.'));

    expect(() => dataTypeParser['parseAsJSON']('{prototype: false}', true))
      .toThrow(new Error('Setting the "prototype" property in a hook input object is not allowed.'));

    expect(() => dataTypeParser['parseAsJSON']('{constructor: false}', true))
      .toThrow(new Error('Setting the "constructor" property in a hook input object is not allowed.'));
  });

  it('#should replace the event keyword with the event placeholder in JSONs', () => {
    expect(dataTypeParser['parseAsJSON']('{someProp: $event}', true)).toEqual({someProp: '__EVENT__'});
  });

  it('#should replace the event placeholder with the event object in JSONs', () => {
    const obj: any = {someProp: '__EVENT__'};
    dataTypeParser['loadJSONVariables'](obj, undefined, true, true, true, true, getParseOptionDefaults());
    expect(obj).toEqual({someProp: true});
  });

  it('#should throw an error if fetching a context variable with a forbidden path', () => {
    expect(() => dataTypeParser['fetchContextVariable']({}, [{type: 'property', value: '__proto__'}]))
      .toThrow(new Error('Accessing the __proto__ property through a context variable is not allowed.'));

    expect(() => dataTypeParser['fetchContextVariable']({}, [{type: 'property', value: 'prototype'}]))
      .toThrow(new Error('Accessing the prototype property through a context variable is not allowed.'));

    expect(() => dataTypeParser['fetchContextVariable']({}, [{type: 'property', value: 'constructor'}]))
      .toThrow(new Error('Accessing the constructor property through a context variable is not allowed.'));
  });

  it('#should not de/serialize nested context variables (fix)', () => {
    const context = {
      randomMethod: (param: any) => ({evaluatedParam: param}),
      randomObj: {
        thisIsAFunction: (firstParam: any, secondParam: any) => { /* some logic */ }
      }
    };

    const firstAttempt = dataTypeParser.evaluate('context.randomMethod(context.randomObj)', context);
    expect(firstAttempt.evaluatedParam.thisIsAFunction).toBeDefined();
    expect(typeof firstAttempt.evaluatedParam.thisIsAFunction).toBe('function');

    // Test event param
    // Using a Map as an example, as Maps can't be serialized via JSON.stringify (will be empty object literal)
    const event = new Map();
    event.set('firstEntry', 'someStringInMap');

    const secondAttempt = dataTypeParser.evaluate('context.randomMethod($event)', context, event);
    expect(secondAttempt.evaluatedParam instanceof Map).toBeTrue();
    expect(secondAttempt.evaluatedParam.get('firstEntry')).toBe('someStringInMap');
    expect(secondAttempt.evaluatedParam).toBe(event);
  });

  it('#should try to find functions in the __proto__ property if they cannot be found on the context property itself', () => {
    // Create method on instance prototype
    /*
    const Person = function(name: string): void {
      this.name = name;
    };*/

    class Person {
      name: string;
      constructor (name: string) {
        this.name = name;
      }
    }
    (Person as any).prototype.getName = function(): string {
      return this.name;
    };
    const john = new Person('John');

    // Try to call that method from the context object
    const context: any = {author: john};
    const name = dataTypeParser['fetchContextVariable'](context, [
      {type: 'property', value: 'author'},
      {type: 'property', value: 'getName'},
      {type: 'function', value: []}
    ]);

    expect(name).toBe('John');
  });

});