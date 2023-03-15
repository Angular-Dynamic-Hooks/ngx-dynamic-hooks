import { matchAll } from '../testing-api';

// Straight Jasmine testing without Angular's testing support
describe('Polyfills', () => {

  it('#should throw an error if given a non-global regex', () => {
    expect(() => matchAll('something', /test/))
      .toThrow(new Error('TypeError: matchAll called with a non-global RegExp argument'));
  });
});
