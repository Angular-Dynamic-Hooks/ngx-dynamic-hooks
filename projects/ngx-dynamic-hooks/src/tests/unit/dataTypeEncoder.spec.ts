import { DataTypeEncoder } from '../testing-api';

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