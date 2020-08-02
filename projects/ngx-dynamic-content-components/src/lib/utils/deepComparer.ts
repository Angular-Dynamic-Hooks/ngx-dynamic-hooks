import { isDevMode, Injectable } from '@angular/core';
import { DetailedStringifyResult } from '../interfaces';

@Injectable()
export class DeepComparer {

  // 1. Inputs
  // -----------------------------------------------------------------

  constructor() {
  }

  /**
   * Tests if two objects are equal by value
   *
   * @param a - The first object
   * @param b - The second object
   */
  isEqual(a, b, compareDepth?: number): boolean {
    const aStringified = this.detailedStringify(a, compareDepth);
    const bStringified = this.detailedStringify(b, compareDepth);

    if (aStringified.result === null || bStringified.result === null) {
      if (isDevMode) {
        console.warn(
          'DynCompHooks: Objects could not be compared by value as one or both of them could not be stringified. Returning false. \n',
          'Values:', a, b
        );
      }
      return false;
    }

    return aStringified.result === bStringified.result;
  }

  /**
   * Like JSON.stringify, but stringifies additional datatypes that would have been
   * nulled otherwise. It also doesn't throw errors on cyclic property paths.
   *
   * If obj can't be stringified for whatever reason, returns null.
   *
   * @param obj - The object to stringify
   */
  detailedStringify(obj, compareDepth?: number): DetailedStringifyResult {
    try {
      // Null cyclic paths
      const compareDepthReached = {count: 0};
      const decylcedObj = this.decycle(obj, [], compareDepth, compareDepthReached);

      const stringified = JSON.stringify(decylcedObj, (key, value) => {
        // If undefined
        if (value === undefined) {
          return 'undefined';
        }
        // If function or class
        if (typeof value === 'function') {
          return value.toString();
        }
        // If symbol
        if (typeof value === 'symbol') {
          return value.toString();
        }
        return value;
      });

      return {result: stringified, compareDepthReachedCount: compareDepthReached.count};
    } catch (e) {
      return {result: null, compareDepthReachedCount: 0};
    }
  }

  /**
   * Travels on object and replaces cyclical references with null
   *
   * @param obj - The object to travel
   * @param stack - To keep track of already travelled objects
   */
  decycle(obj, stack = [], compareDepth: number = 5, compareDepthReached: { count: number; }) {
    if (stack.length > compareDepth) {
      compareDepthReached.count++;
      return null;
    }

    if (!obj || typeof obj !== 'object' || obj instanceof Date) {
        return obj;
    }

    // Check if cyclical and we've traveled this obj already
    //
    // Test this not by object reference, but by object PROPERTY reference/equality. If an object has identical properties,
    // the object is to be considered identical even if it has a different reference itself.
    //
    // This is to prevent a sneaky bug where you would return an object as the input (or part of an input) that contains a reference to
    // the object holding it (like returning the context object that contains a reference to the parent component holding the context object).
    // In the example, when the context object changes by reference, the old input will be compared with the new input. However, as the old input still references
    // the old context object that now (through the parent component) contains a reference to the new context object, while the new input references the new context
    // object exclusively, the decycle function would produce different results for them if it only checked cyclical paths by reference, even if the context object remained identical in value.
    // The way to prevent this bug is by checking cyclical paths via object properties rather than the object itself.
    for (const stackObj of stack) {
      if (this.objEqualsProperties(obj, stackObj)) {
        return null;
      }
    }

    const s = stack.concat([obj]);

    if (Array.isArray(obj)) {
      const newArray = [];
      for (const entry of obj) {
        newArray.push(this.decycle(entry, s, compareDepth, compareDepthReached));
      }
      return newArray;
    } else {
      const newObj = {};
      for (const key of Object.keys(obj)) {
        newObj[key] = this.decycle(obj[key], s, compareDepth, compareDepthReached);
      }
      return newObj;
    }
  }

  /**
   * Returns true when all the properties of one object equal those of another object, otherwise false.
   *
   * @param a - The first object
   * @param b - The second object
   */
  objEqualsProperties(a, b) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    for (const aKey of aKeys) {
      if (a[aKey] !== b[aKey]) {
        return false;
      }
    }

    return true;
  }
}
