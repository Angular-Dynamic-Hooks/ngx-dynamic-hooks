import { HookFinder } from '../testing-api';

/**
 * HookFinder tests
 */
describe('HookFinder', () => {
  let hookFinder: HookFinder;
  beforeEach(() => { hookFinder = new HookFinder(); });

  it('#should find singletag hook positions as expected', () => {
    const openingTagRegex = /openingTag/g;
    const content = `
      <h1>Some html</h1>
      <p>Here is an openingTag</p>
      <p>Somewhere in the middle of the content. And another openingTag at the end</p>
    `;

    const position = hookFinder.find(content, openingTagRegex);

    expect(position).toEqual([
      {
        openingTagStartIndex: 46,
        openingTagEndIndex: 56,
        closingTagStartIndex: null,
        closingTagEndIndex: null
      },
      {
        openingTagStartIndex: 122,
        openingTagEndIndex: 132,
        closingTagStartIndex: null,
        closingTagEndIndex: null
      }
    ]);
  });

  it('#should find enclosing hook positions as expected', () => {
    const openingTagRegex = /openingTag/g;
    const closingTagRegex = /closingTag/g;
    const content = `
      <h1>Some enclosing html</h1>
      <p>Here is an openingTag</p>
      <p>Then we have a nested openingTag with a closingTag</p>
      <p>And then the outer closingTag</p>
    `;

    const position = hookFinder.find(content, openingTagRegex, closingTagRegex);

    expect(position).toEqual([
      {
        openingTagStartIndex: 102,
        openingTagEndIndex: 112,
        closingTagStartIndex: 120,
        closingTagEndIndex: 130
      },
      {
        openingTagStartIndex: 56,
        openingTagEndIndex: 66,
        closingTagStartIndex: 163,
        closingTagEndIndex: 173
      }
    ]);
  });

  it('#should ignore tags that start before previous tag has ended when finding enclosing hooks', () => {
    spyOn(console, 'warn').and.callThrough();
    const openingTagRegex = /openingTag/g;
    const closingTagRegex = /Tag/g;
    const content = 'Here is an openingTag.';

    expect(hookFinder.find(content, openingTagRegex, closingTagRegex)).toEqual([]);
    expect((console as any).warn['calls'].allArgs()[0])
      .toContain('Syntax error - New tag "Tag" started at position 18 before previous tag "openingTag" ended at position 21. Ignoring.');
  });

  it('#should ignore closing tags that appear without a corresponding opening tag', () => {
    spyOn(console, 'warn').and.callThrough();
    const openingTagRegex = /openingTag/g;
    const closingTagRegex = /closingTag/g;

    const content = 'Here is an openingTag and a closingTag. Here is just a closingTag.';
    expect(hookFinder.find(content, openingTagRegex, closingTagRegex)).toEqual([{ openingTagStartIndex: 11, openingTagEndIndex: 21, closingTagStartIndex: 28, closingTagEndIndex: 38 }]);
    expect((console as any).warn['calls'].allArgs()[0])
      .toContain('Syntax error - Closing tag without preceding opening tag found: "closingTag". Ignoring.');
  });

  it('#should skip nested hooks, if not allowed', () => {
    const openingTagRegex = /openingTag/g;
    const closingTagRegex = /closingTag/g;

    const content = 'Here is the outer openingTag, an inner openingTag, an inner closingTag and an outer closingTag.';
    expect(hookFinder.find(content, openingTagRegex, closingTagRegex, false)).toEqual([{ openingTagStartIndex: 18, openingTagEndIndex: 28, closingTagStartIndex: 84, closingTagEndIndex: 94 }]);
  });

});