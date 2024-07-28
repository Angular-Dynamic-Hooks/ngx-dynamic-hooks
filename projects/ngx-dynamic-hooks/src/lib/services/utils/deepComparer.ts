import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { getParseOptionDefaults, ParseOptions } from '../settings/options';


/**
 * The object returned by the detailedStringify function in DeepComparer.
 * Contains the stringified value as well as the number of times the maximum stringify depth was reached.
 */
export interface DetailedStringifyResult {
  result: string|null;
  depthReachedCount: number;
}

/**
 * A service for comparing two variables by value instead of by reference
 */
@Injectable({
  providedIn: 'root'
})
export class DeepComparer {

  // 1. Inputs
  // -----------------------------------------------------------------

  constructor(private logger: Logger) {
  }

  /**
   * Tests if two objects are equal by value
   *
   * @param a - The first object
   * @param b - The second object
   * @param compareDepth - How many levels deep to compare
   * @param options - The current parseOptions
   */
  isEqual(a: any, b: any, compareDepth?: number, options: ParseOptions = getParseOptionDefaults()): boolean {
    const aStringified = this.detailedStringify(a, compareDepth);
    const bStringified = this.detailedStringify(b, compareDepth);

    if (aStringified.result === null || bStringified.result === null) {
      this.logger.warn([
        'Objects could not be compared by value as one or both of them could not be stringified. Returning false. \n',
        'Objects:', a, b
      ], options);
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
   * @param depth - How many levels deep to stringify
   */
  detailedStringify(obj: any, depth?: number): DetailedStringifyResult {
    try {
      // Null cyclic paths
      const depthReached = {count: 0};
      const decylcedObj = this.decycle(obj, [], depth, depthReached);

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

      return {result: stringified, depthReachedCount: depthReached.count};
    } catch (e) {
      return {result: null, depthReachedCount: 0};
    }
  }

  /**
   * Travels on object and replaces cyclical references with null
   *
   * @param obj - The object to travel
   * @param stack - To keep track of already travelled objects
   * @param depth - How many levels deep to decycle
   * @param depthReached - An object to track the number of times the max depth was reached
   */
  decycle(obj: any, stack: any[] = [], depth: number = 5, depthReached: { count: number; }): any {
    if (stack.length > depth) {
      depthReached.count++;
      return null;
    }

    if (!obj || typeof obj !== 'object' || obj instanceof Date) {
        return obj;
    }

    // Check if cyclical and we've traveled this obj already
    //
    // Note: Test this not by object reference, but by object PROPERTY reference/equality. If an object has identical properties,
    // the object is to be considered identical even if it has a different reference itself.
    //
    // Explanation: This is to prevent a sneaky bug when comparing by value and a parser returns an object as an input that contains a reference to the object holding it
    // (like returning the context object that contains a reference to the parent component holding the context object).
    // In this example, when the context object changes by reference, the old input will be compared with the new input. However, as the old input consists of
    // the old context object that now (through the parent component) contains a reference to the new context object, while the new input references the new context
    // object exclusively, the decycle function would produce different results for them if it only checked cyclical paths by reference (even if the context object
    // remained identical in value!)
    //
    // Though an unlikely scenario, checking cyclical paths via object properties rather than the object reference itself solves this problem.
    for (const stackObj of stack) {
      if (this.objEqualsProperties(obj, stackObj)) {
        return null;
      }
    }

    const s = stack.concat([obj]);

    if (Array.isArray(obj)) {
      const newArray = [];
      for (const entry of obj) {
        newArray.push(this.decycle(entry, s, depth, depthReached));
      }
      return newArray;
    } else {
      const newObj: any = {};
      for (const key of Object.keys(obj)) {
        newObj[key] = this.decycle(obj[key], s, depth, depthReached);
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
  objEqualsProperties(a: any, b: any): boolean {
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
