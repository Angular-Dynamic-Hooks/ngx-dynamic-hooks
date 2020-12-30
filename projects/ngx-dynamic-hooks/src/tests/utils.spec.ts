import { DataTypeEncoder } from '../lib/utils/dataTypeEncoder';
import { DeepComparer } from '../lib/utils/deepComparer';
import { DataTypeParser } from '../lib/utils/dataTypeParser';
import { HookFinder } from '../lib/utils/hookFinder';

// These tests mostly only test the lines/branches that aren't already covered by core.spec.ts

/**
 * DataTypeEncoder tests
 */
describe('DataTypeEncoder', () => {
  let dataTypeEncoder: DataTypeEncoder;
  beforeEach(() => { dataTypeEncoder = new DataTypeEncoder(); });

  it('#should throw an error if a substring was not closed properly', () => {
    expect(() => dataTypeEncoder.encodeSubstrings('This is a normal "substring". This substring is not "closed.'))
      .toThrow(new Error('Input parse error. String was opened, but not closed.'));
  });

  it('#should throw an error if a subfunction is closed without opening it first', () => {
    expect(() => dataTypeEncoder.encodeSubfunctions('{prop: func)}'))
      .toThrow(new Error('Input parse error. Closed function bracket without opening it first.'));
  });

  it('#should throw an error if a subbracket was not closed properly', () => {
    expect(() => dataTypeEncoder.encodeVariableSubbrackets('{prop: context["normal"].something[}'))
      .toThrow(new Error('Input parse error. Opened bracket without closing it.'));
  });

  it('#should escape double quotes', () => {
    expect(dataTypeEncoder.escapeDoubleQuotes('A text with "double quotes".')).toBe('A text with \\"double quotes\\".');
  });
});

/**
 * DataTypeParser tests
 */
describe('DataTypeParser', () => {
  let dataTypeParser: DataTypeParser;
  beforeEach(() => { dataTypeParser = new DataTypeParser(new DataTypeEncoder()); });

  it('#should throw an error if trying to parse a JSON with forbidden properties', () => {
    expect(() => dataTypeParser.parseAsJSON('{__proto__: false}'))
      .toThrow(new Error('Setting the "__proto__" property in a hook input object is not allowed.'));

    expect(() => dataTypeParser.parseAsJSON('{prototype: false}'))
      .toThrow(new Error('Setting the "prototype" property in a hook input object is not allowed.'));

    expect(() => dataTypeParser.parseAsJSON('{constructor: false}'))
      .toThrow(new Error('Setting the "constructor" property in a hook input object is not allowed.'));
  });

  it('#should replace the event keyword with the event placeholder in JSONs', () => {
    expect(dataTypeParser.parseAsJSON('{someProp: $event}')).toEqual({someProp: '__EVENT__'});
  });

  it('#should replace the event placeholder with the event object in JSONs', () => {
    const obj: any = {someProp: '__EVENT__'};
    dataTypeParser.loadVariablesLoop(obj, undefined, true);
    expect(obj).toEqual({someProp: true});
  });

  it('#should throw an error if fetching a context variable with a forbidden path', () => {
    expect(() => dataTypeParser.fetchContextVariable({}, [{type: 'property', value: '__proto__'}]))
      .toThrow(new Error('Accessing the __proto__ property through a context variable is not allowed.'));

    expect(() => dataTypeParser.fetchContextVariable({}, [{type: 'property', value: 'prototype'}]))
      .toThrow(new Error('Accessing the prototype property through a context variable is not allowed.'));

    expect(() => dataTypeParser.fetchContextVariable({}, [{type: 'property', value: 'constructor'}]))
      .toThrow(new Error('Accessing the constructor property through a context variable is not allowed.'));
  });

  it('#should try to find functions in the __proto__ property if they cannot be found on the context property itself', () => {
    // Create method on instance prototype
    const Person = function(name: string): void {
      this.name = name;
    };
    Person.prototype.getName = function(): string {
      return this.name;
    };
    const john = new Person('John');

    // Try to call that method from the context object
    const context: any = {author: john};
    const name = dataTypeParser.fetchContextVariable(context, [
      {type: 'property', value: 'author'},
      {type: 'property', value: 'getName'},
      {type: 'function', value: []}
    ]);

    expect(name).toBe('John');
  });

});

/**
 * DeepComparer tests
 */
describe('DeepComparer', () => {
  let deepComparer: DeepComparer;
  beforeEach(() => { deepComparer = new DeepComparer(); });

  it('#should be able to stringify simple numbers', () => {
    expect(deepComparer.detailedStringify(123456).result).toBe('123456');
  });

  it('#should be able to stringify float numbers', () => {
    expect(deepComparer.detailedStringify(123.456).result).toBe('123.456');
  });

  it('#should be able to stringify strings', () => {
    expect(deepComparer.detailedStringify('some string').result).toBe('"some string"');
  });

  it('#should be able to stringify objects', () => {
    expect(deepComparer.detailedStringify({
      someProp: true,
      array: [1, 2]
    }).result).toBe('{"someProp":true,"array":[1,2]}');
  });

  it('#should preserve undefined in objects', () => {
    expect(deepComparer.detailedStringify({
      someProp: undefined
    }).result).toBe('{"someProp":"undefined"}');
  });

  it('#should be able to stringify functions', () => {
    expect(deepComparer.detailedStringify({
      someFunc: function (event, someParam) { console.log("this is a test"); var testVar = true; var anotherVar = ["this", "is", "an", "array"]; }
    }).result).toBe('{"someFunc":"function (event, someParam) { console.log(\\"this is a test\\"); var testVar = true; var anotherVar = [\\"this\\", \\"is\\", \\"an\\", \\"array\\"]; }"}');
  });

  it('#should be able to stringify symbols', () => {
    expect(deepComparer.detailedStringify({
      someSymbol: Symbol('uniqueSymbol')
    }).result).toBe('{"someSymbol":"Symbol(uniqueSymbol)"}');
  });

  it('#should remove cyclic objects paths', () => {
    const parentObject = {};
    const childObject = {parent: parentObject};
    parentObject['child'] = childObject;

    expect(deepComparer.detailedStringify(parentObject).result).toBe('{"child":{"parent":null}}');
  });

  it('#should remove cyclic objects paths by recognizing them by their properties, not reference', () => {
    const parentObject = {name: 'this is the parent'};
    const childObject = {name: 'this is the child'};
    const anotherParentObject = {name: 'this is the parent'};
    parentObject['child'] = childObject;
    childObject['parent'] = anotherParentObject;
    anotherParentObject['child'] = childObject;

    expect(deepComparer.detailedStringify(parentObject).result).toBe('{"name":"this is the parent","child":{"name":"this is the child","parent":null}}');
  });

  it('#should stop at the maximum compareDepth', () => {
    const deepObj = {
      firstLevel: {
        secondLevel: {
          thirdLevel: {
            fourthLevel: {
              fifthLevel: {
                var: 'this should be cut off'
              }
            }
          }
        }
      }
    };
    expect(deepComparer.detailedStringify(deepObj, 4).result).toBe('{"firstLevel":{"secondLevel":{"thirdLevel":{"fourthLevel":{"fifthLevel":null}}}}}');
  });

  it('#should be able to compare two objects by value', () => {
    const obj1 = {name: 'Marlene'};
    const obj2 = {name: 'Marlene'};
    expect(deepComparer.isEqual(obj1, obj2)).toBe(true);
  });

  it('#should warn and return false if two object cannot be compared', () => {
    // Can't think of an input that would break it, but that doesn't mean one doesn't exist
    // So just break it manually by not removing cyclical refs for this test
    const childObj = {};
    const parentObj = {child: childObj};
    childObj['parent'] = parentObj;
    spyOn(deepComparer, 'decycle').and.returnValue(parentObj);
    spyOn(console, 'warn').and.callThrough();

    const obj1 = {name: 'Marlene'};
    const obj2 = {name: 'Marlene'};
    expect(deepComparer.isEqual(obj1, obj2)).toBe(false);
    expect(console.warn['calls'].mostRecent().args[0]).toContain('Objects could not be compared by value as one or both of them could not be stringified. Returning false.');
  });

});

/**
 * HookFinder tests
 */
describe('HookFinder', () => {
  let hookFinder: HookFinder;
  beforeEach(() => { hookFinder = new HookFinder(); });

  it('#should ignore tags that start before previous tag has ended when finding enclosing hooks', () => {
    spyOn(console, 'warn').and.callThrough();
    const openingTagRegex = /openingTag/g;
    const closingTagRegex = /Tag/g;
    const content = 'Here is an openingTag.';

    expect(hookFinder.findEnclosingHooks(content, openingTagRegex, closingTagRegex)).toEqual([]);
    expect(console.warn['calls'].allArgs()[0])
      .toContain('Syntax error - New tag "Tag" started at position 18 before previous tag "openingTag" ended at position 21. Ignoring.');
  });

  it('#should ignore closing tags that appear without a corresponding opening tag', () => {
    spyOn(console, 'warn').and.callThrough();
    const openingTagRegex = /openingTag/g;
    const closingTagRegex = /closingTag/g;

    const content = 'Here is an openingTag and a closingTag. Here is just a closingTag.';
    expect(hookFinder.findEnclosingHooks(content, openingTagRegex, closingTagRegex)).toEqual([{ openingTagStartIndex: 11, openingTagEndIndex: 21, closingTagStartIndex: 28, closingTagEndIndex: 38 }]);
    expect(console.warn['calls'].allArgs()[0])
      .toContain('Syntax error - Closing tag without preceding opening tag found: "closingTag". Ignoring.');
  });

  it('#should skip nested hooks, if not allowed', () => {
    const openingTagRegex = /openingTag/g;
    const closingTagRegex = /closingTag/g;

    const content = 'Here is the outer openingTag, an inner openingTag, an inner closingTag and an outer closingTag.';
    expect(hookFinder.findEnclosingHooks(content, openingTagRegex, closingTagRegex, false)).toEqual([{ openingTagStartIndex: 18, openingTagEndIndex: 28, closingTagStartIndex: 84, closingTagEndIndex: 94 }]);
  });

});
