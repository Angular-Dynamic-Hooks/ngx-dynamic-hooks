import { DeepComparer } from '../lib/utils/deepComparer';

// Straight Jasmine testing without Angular's testing support
describe('BindingsComparer', () => {
  let deepComparer;
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
      someFunc: (event, someParam) => { console.log("this is a test"); const testVar = true; const anotherVar = ["this", "is", "an", "array"]}
    }).result).toBe('{"someFunc":"(event, someParam) => { console.log(\\"this is a test\\"); const testVar = true; const anotherVar = [\\"this\\", \\"is\\", \\"an\\", \\"array\\"]; }"}');
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
});
