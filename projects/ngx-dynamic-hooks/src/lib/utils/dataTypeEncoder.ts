import { Injectable } from '@angular/core';
import { matchAll } from '../polyfills/matchAll';

interface TextSegment {
  startIndex: number;
  endIndex: number;
}

/**
 * A service that provides various functions for en- and decoding data type strings in order to make them
 * meaningfully parseable by regex
 */
@Injectable()
export class DataTypeEncoder {

  constructor() {
  }

  // Substrings
  // -----------------------------------------------------

  /**
   * Finds all substrings in a piece of text and replaces all special characters within with @@@...@@@-placeholders.
   *
   * @param text - The text to parse for substrings
   */
  encodeSubstrings(text: string): string {
    // Get a list of all quotes (that are not preceded by an escaping backslash)
    const singleQuotes: any = matchAll(text, /'/gm).filter(match => match.index === 0 || text[match.index - 1] !== '\\');
    const doubleQuotes: any = matchAll(text, /"/gm).filter(match => match.index === 0 || text[match.index - 1] !== '\\');
    const graveQuotes: any = matchAll(text, /`/gm).filter(match => match.index === 0 || text[match.index - 1] !== '\\');
    const allQuotes = [...singleQuotes, ...doubleQuotes, ...graveQuotes];
    allQuotes.sort((a, b) => a['index'] - b['index']);

    // Create quotes text segments
    const quoteSegments: Array<TextSegment> = [];
    let outermostOpenedQuote = null;
    for (const quote of allQuotes) {
      if (!outermostOpenedQuote) {
        outermostOpenedQuote = quote;
      } else {
        if (outermostOpenedQuote[0] === quote[0]) {
          quoteSegments.push({
            startIndex: outermostOpenedQuote.index + 1,
            endIndex: quote['index']
          });
          outermostOpenedQuote = null;
        }
      }
    }

    if (outermostOpenedQuote !== null) {
      throw Error('Input parse error. String was opened, but not closed.');
    }

    // Encode quote segments
    const encodedBracketsText = this.encodeTextSegments(text, quoteSegments, this.encodeStringSpecialChars);

    return encodedBracketsText;
  }

  /**
   * Encodes all special characters that might be confused as code syntax in a piece of string
   *
   * @param text - The text to encode
   */
  encodeStringSpecialChars(text: string): string {
    text = text.replace(/'/g, '@@@singlequote@@@');
    text = text.replace(/"/g, '@@@doublequote@@@');
    text = text.replace(/`/g, '@@@gravequote@@@');
    text = text.replace(/:/g, '@@@colon@@@');
    text = text.replace(/;/g, '@@@semicolon@@@');
    text = text.replace(/\./g, '@@@dot@@@');
    text = text.replace(/,/g, '@@@comma@@@');
    text = text.replace(/\\/g, '@@@backslash@@@');
    text = text.replace(/\(/g, '@@@openRoundBracket@@@');
    text = text.replace(/\)/g, '@@@closeRoundBracket@@@');
    text = text.replace(/\[/g, '@@@openSquareBracket@@@');
    text = text.replace(/\]/g, '@@@closeSquareBracket@@@');
    text = text.replace(/\{/g, '@@@openCurlyBracket@@@');
    text = text.replace(/\}/g, '@@@closeCurlyBracket@@@');
    return text;
  }

  /**
   * Decodes the special characters again
   *
   * @param text - The text to decode
   */
  decodeStringSpecialChars(text: string): string {
    text = text.replace(/@@@singlequote@@@/g, '\'');
    text = text.replace(/@@@doublequote@@@/g, '"');
    text = text.replace(/@@@gravequote@@@/g, '`');
    text = text.replace(/@@@colon@@@/g, ':');
    text = text.replace(/@@@semicolon@@@/g, ';');
    text = text.replace(/@@@dot@@@/g, '.');
    text = text.replace(/@@@comma@@@/g, ',');
    text = text.replace(/@@@backslash@@@/g, '\\');
    text = text.replace(/@@@openRoundBracket@@@/g, '(');
    text = text.replace(/@@@closeRoundBracket@@@/g, ')');
    text = text.replace(/@@@openSquareBracket@@@/g, '[');
    text = text.replace(/@@@closeSquareBracket@@@/g, ']');
    text = text.replace(/@@@openCurlyBracket@@@/g, '{');
    text = text.replace(/@@@closeCurlyBracket@@@/g, '}');
    return text;
  }

  // Subfunctions
  // -----------------------------------------------------

  /**
   * Finds all subfunctions in a piece of text and replaces their round brackets with @@@...@@@-placeholders.
   *
   * @param text - The text to parse for substrings
   */
  encodeSubfunctions(text: string): string {
    const openingBrackets = matchAll(text, /\(/gm);
    const closingBrackets = matchAll(text, /\)/gm);
    const allBrackets = [...openingBrackets, ...closingBrackets];
    allBrackets.sort((a, b) => a['index'] - b['index']);

    // Create functions text segments
    const functionSegments: Array<TextSegment> = [];
    const openedBrackets = [];
    for (const bracket of allBrackets) {
      if (bracket[0] === '(') {
        openedBrackets.push(bracket);
      } else {
        if (openedBrackets.length === 0) {
          throw Error('Input parse error. Closed function bracket without opening it first.');
        }
        // Only collect the outermost function brackets, not nested ones
        if (openedBrackets.length === 1) {
          functionSegments.push({
            startIndex: openedBrackets[0].index + 1,
            endIndex: bracket['index']
          });
        }
        openedBrackets.pop();
      }
    }

    if (openedBrackets.length !== 0) {
      throw Error('Input parse error. Opened function bracket without closing it.');
    }

    // Encode quote segments
    const encodedFunctionsText = this.encodeTextSegments(text, functionSegments, this.encodeFunctionBrackets);

    return encodedFunctionsText;
  }

  /**
   * Encodes all round brackets with harmless placeholders
   *
   * @param text - The text to encode
   */
  encodeFunctionBrackets(text: string): string {
    text = text.replace(/\(/g, '@@@fnOpenBracket@@@');
    text = text.replace(/\)/g, '@@@fnCloseBracket@@@');
    return text;
  }

  /**
   * Decodes all round brackets again
   *
   * @param text - The text to decode
   */
  decodeFunctionBrackets(text: string): string {
    text = text.replace(/@@@fnOpenBracket@@@/g, '\(');
    text = text.replace(/@@@fnCloseBracket@@@/g, '\)');
    return text;
  }

  // Subbrackets
  // -----------------------------------------------------

  /**
   * Finds all subbrackets in a piece of text and replaces their brackets with @@@...@@@-placeholders.
   *
   * @param text - The text to parse for substrings
   */
  encodeVariableSubbrackets(text: string): string {

    // Property accessor opening brackets can be identified by what they are preceded by.
    // Must be a) text, b) closing square bracket or c) closing round bracket. Arrays can't be preceded by any of these.
    const variableOpeningBracketsWithLookbehinds = '(?<=[a-zA-Z_$\\]\)])\\['; // Too new for many older browsers
    const variableOpeningBrackets = '(?:[a-zA-Z_$\\]\)])(\\[)';

    const openingBrackets = matchAll(text, new RegExp(variableOpeningBrackets, 'gm'));
    // Note: Can't simply find closing brackets as well (as is done in the other encoder functions), because the closing
    // bracket doesn't have a uniquely identifiable syntax. Might also be array endings.

    // Find the corresponding closing bracket for each opening bracket by parsing the following brackets
    const bracketSegments: Array<TextSegment> = [];
    for (const openingBracket of openingBrackets) {
      const followingText = text.substr(openingBracket.index + 2); // openingBracket.index + 2, b/c the regex starts at the character before the opening bracket and followingText is supposed to start after the opening bracket
      const followingOpeningBrackets = matchAll(followingText, /\[/gm);
      const followingClosingBrackets = matchAll(followingText, /\]/gm);
      const allFollowingBrackets = [...followingOpeningBrackets, ...followingClosingBrackets];
      allFollowingBrackets.sort((a, b) => a['index'] - b['index']);

      let openedBrackets = 1; // Start with the first opening bracket already counted
      for (const followingBracket of allFollowingBrackets) {
        openedBrackets = followingBracket[0] === ']' ? openedBrackets - 1 : openedBrackets + 1;
        if (openedBrackets === 0) {
          bracketSegments.push({
            startIndex: openingBracket.index + 2,
            endIndex: openingBracket.index + 2 + followingBracket['index']
          });
          break;
        }
      }

      if (openedBrackets !== 0) {
        throw Error('Input parse error. Opened bracket without closing it.');
      }
    }

    // Throw out nested brackets
    const outerBracketSegments = [];
    for (const bracketSegment of bracketSegments) {
      if (outerBracketSegments.length === 0) {
        outerBracketSegments.push(bracketSegment);
      } else {
        if (outerBracketSegments[outerBracketSegments.length - 1].endIndex < bracketSegment.startIndex) {
          outerBracketSegments.push(bracketSegment);
        }
      }
    }

    // Encode bracket segments
    const encodedBracketsText = this.encodeTextSegments(text, outerBracketSegments, this.encodeVariableBrackets);

    return encodedBracketsText;
  }

  /**
   * Encodes all brackets with harmless placeholders
   *
   * @param text - The text to encode
   */
  encodeVariableBrackets(text: string): string {
    text = text.replace(/\[/g, '@@@variableOpeningBracket@@@');
    text = text.replace(/\]/g, '@@@variableClosingBracket@@@');
    return text;
  }

  /**
   * Decodes all brackets again
   *
   * @param text - The text to encode
   */
  decodeVariableBrackets(text: string): string {
    text = text.replace(/@@@variableOpeningBracket@@@/g, '\[');
    text = text.replace(/@@@variableClosingBracket@@@/g, '\]');
    return text;
  }

  // Context var placeholder
  // -----------------------------------------------------

  /**
   * Transforms a context var (that is already encoded for substrings, subfunctions and subbrackets) into a string placeholder
   * by encoding the context var syntax itself. This is so that can be safely parsed by JSON.parse() as a string and also so it
   * won't be misinterpreted by other regexes looking for JSON syntax (especially arrays b/c of context-var []-property-brackets)
   *
   * @param contextVar - The context var to transform
   */
  transformContextVarIntoPlacerholder(contextVar: string): string {
    // Replace context. with __CXT__
    contextVar = '__CXT__' + contextVar.substr(7);
    // Encode variable syntax
    contextVar = contextVar.replace(/\"/g, '@@@cxtDoubleQuote@@@');
    contextVar = contextVar.replace(/\./g, '@@@cxtDot@@@');
    contextVar = contextVar.replace(/\[/g, '@@@cxtOpenSquareBracket@@@');
    contextVar = contextVar.replace(/\]/g, '@@@cxtCloseSquareBracket@@@');
    contextVar = contextVar.replace(/\(/g, '@@@cxtOpenRoundBracket@@@');
    contextVar = contextVar.replace(/\)/g, '@@@cxtCloseRoundBracket@@@');
    return contextVar;
  }

  transformPlaceholderIntoContextVar(contextVar: string): string {
    contextVar = 'context' + contextVar.substr(7);
    contextVar = contextVar.replace(/@@@cxtDoubleQuote@@@/g, '"');
    contextVar = contextVar.replace(/@@@cxtDot@@@/g, '.');
    contextVar = contextVar.replace(/@@@cxtOpenSquareBracket@@@/g, '[');
    contextVar = contextVar.replace(/@@@cxtCloseSquareBracket@@@/g, ']');
    contextVar = contextVar.replace(/@@@cxtOpenRoundBracket@@@/g, '(');
    contextVar = contextVar.replace(/@@@cxtCloseRoundBracket@@@/g, ')');
    return contextVar;
  }

  // Other
  // -----------------------------------------------------

  /**
   * Takes a piece of text as well as array of TextSegments and encodes them with the help of an encodingFunction
   * The encoded text is then automatically assembled and returned.
   *
   * @param text - The text in question
   * @param specialTextSegments - The segments in the text to encode
   * @param encodingFunction - The encoding function to use
   */
  private encodeTextSegments(text: string, specialTextSegments: Array<TextSegment>, encodingFunction: any): string {
    // 1. Divide whole text into two types of segments: Those to be encoded and those to be left as they are
    const allTextSegments = [];
    for (const specialTextSegment of specialTextSegments) {
      // Push normal text segment since last special segment
      const lastSegmentEndIndex = allTextSegments.length === 0 ? 0 : allTextSegments[allTextSegments.length - 1].endIndex;
      allTextSegments.push({
        type: 'text',
        startIndex: lastSegmentEndIndex,
        endIndex: specialTextSegment.startIndex,
        string: text.substr(lastSegmentEndIndex, specialTextSegment.startIndex - lastSegmentEndIndex)
      });

      // Push next special segment
      allTextSegments.push({
        type: 'special',
        startIndex: specialTextSegment.startIndex,
        endIndex: specialTextSegment.endIndex,
        string: text.substr(specialTextSegment.startIndex, specialTextSegment.endIndex - specialTextSegment.startIndex)
      });
    }
    // Add text segment for trailing text after last special segment
    const lastBracketEndIndex = allTextSegments.length === 0 ? 0 : allTextSegments[allTextSegments.length - 1].endIndex;
    allTextSegments.push({
      type: 'text',
      startIndex: lastBracketEndIndex,
      endIndex: text.length - 1,
      string: text.substr(lastBracketEndIndex)
    });

    // 2. Encode all special segments
    for (const segment of allTextSegments) {
      if (segment.type === 'special') {
        segment.string = encodingFunction(segment.string);
      }
    }

    // 3. Concat everything together again
    let encodedString = '';
    for (const segment of allTextSegments) {
      encodedString += segment.string;
    }

    return encodedString;
  }

  /**
   * Strips all escaping backslashes from a piece of text
   *
   * @param text - The text in question
   */
  stripSlashes(text: string): string {
    return text.replace(/\\(.)/g, '$1');
    // return text.replace(new RegExp('\\\\(.)', 'g'), '$1');
  }

  /**
   * Escapes all double quotes in a piece of text
   *
   * @param text - The text in question
   */
  escapeDoubleQuotes(text: string): string {
    const result = text.replace(/\\/g, '\\\\').replace(/\"/g, '\\"');
    return result;
  }
}
