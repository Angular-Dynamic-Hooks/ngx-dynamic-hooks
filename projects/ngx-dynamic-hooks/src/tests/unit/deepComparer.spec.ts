import { DeepComparer } from '../testing-api';

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
      someFunc: function (event: any, someParam: any) { console.log("this is a test"); var testVar = true; var anotherVar = ["this", "is", "an", "array"]; }
    }).result).toContain('{"someFunc":"function (event, someParam) {'); // The exact function stringification can vary a bit and sometimes has line breaks in it
  });

  it('#should be able to stringify symbols', () => {
    expect(deepComparer.detailedStringify({
      someSymbol: Symbol('uniqueSymbol')
    }).result).toBe('{"someSymbol":"Symbol(uniqueSymbol)"}');
  });

  it('#should remove cyclic objects paths', () => {
    const parentObject: any = {};
    const childObject: any = {parent: parentObject};
    parentObject['child'] = childObject;

    expect(deepComparer.detailedStringify(parentObject).result).toBe('{"child":{"parent":null}}');
  });

  it('#should remove cyclic objects paths by recognizing them by their properties, not reference', () => {
    const parentObject: any = {name: 'this is the parent'};
    const childObject: any = {name: 'this is the child'};
    const anotherParentObject: any = {name: 'this is the parent'};
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
    const childObj: any = {};
    const parentObj: any = {child: childObj};
    childObj['parent'] = parentObj;
    spyOn(deepComparer, 'decycle').and.returnValue(parentObj);
    spyOn(console, 'warn').and.callThrough();

    const obj1 = {name: 'Marlene'};
    const obj2 = {name: 'Marlene'};
    expect(deepComparer.isEqual(obj1, obj2)).toBe(false);
    expect((console as any).warn['calls'].mostRecent().args[0]).toContain('Objects could not be compared by value as one or both of them could not be stringified. Returning false.');
  });

});