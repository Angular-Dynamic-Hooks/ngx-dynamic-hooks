import { HookFinder } from '../testing-api';

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
    expect((console as any).warn['calls'].allArgs()[0])
      .toContain('Syntax error - New tag "Tag" started at position 18 before previous tag "openingTag" ended at position 21. Ignoring.');
  });

  it('#should ignore closing tags that appear without a corresponding opening tag', () => {
    spyOn(console, 'warn').and.callThrough();
    const openingTagRegex = /openingTag/g;
    const closingTagRegex = /closingTag/g;

    const content = 'Here is an openingTag and a closingTag. Here is just a closingTag.';
    expect(hookFinder.findEnclosingHooks(content, openingTagRegex, closingTagRegex)).toEqual([{ openingTagStartIndex: 11, openingTagEndIndex: 21, closingTagStartIndex: 28, closingTagEndIndex: 38 }]);
    expect((console as any).warn['calls'].allArgs()[0])
      .toContain('Syntax error - Closing tag without preceding opening tag found: "closingTag". Ignoring.');
  });

  it('#should skip nested hooks, if not allowed', () => {
    const openingTagRegex = /openingTag/g;
    const closingTagRegex = /closingTag/g;

    const content = 'Here is the outer openingTag, an inner openingTag, an inner closingTag and an outer closingTag.';
    expect(hookFinder.findEnclosingHooks(content, openingTagRegex, closingTagRegex, false)).toEqual([{ openingTagStartIndex: 18, openingTagEndIndex: 28, closingTagStartIndex: 84, closingTagEndIndex: 94 }]);
  });

});