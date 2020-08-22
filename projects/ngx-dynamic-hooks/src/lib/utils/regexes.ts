export const regexes: any = {};

// Attribute regex
regexes.attributeNameNoBracketsRegex = '([a-zA-Z]+)';
regexes.attributeNameBracketsRegex = '\\[([a-zA-Z]+)\\]';
regexes.attributeNameRoundBracketsRegex = '\\(([a-zA-Z]+)\\)';
regexes.attributeNameRegex = '(?:' + regexes.attributeNameNoBracketsRegex + '|' + regexes.attributeNameBracketsRegex + '|' + regexes.attributeNameRoundBracketsRegex + ')';
regexes.attributeValueDoubleQuotesRegex = '\"((?:\\\\.|[^\"])*?)\"';    // Clever bit of regex to allow escaped chars in strings: https://stackoverflow.com/a/1016356/3099523
regexes.attributeValueSingleQuotesRegex = '\'((?:\\\\.|[^\'])*?)\'';

// Context var regex examples: https://regex101.com/r/zSbY7M/4
// Supports the dot notation, the [] notation as well as function calls () for building variable paths
regexes.variablePathDotNotation = '\\.[a-zA-Z_$]+[a-zA-Z0-9_$]*';
regexes.variableBracketsNotation = '\\[[^\\]]*\\]'; // Relies on nested '[]'brackets being encoded
regexes.variablePathFunctionCall = '\\([^\\)]*\\)'; // Relies on nested '()'-brackets being encoded.
regexes.variablePathPartRegex = '(?:' + regexes.variablePathDotNotation + '|' + regexes.variableBracketsNotation + '|' + regexes.variablePathFunctionCall + ')';
regexes.contextVariableRegex = 'context' + regexes.variablePathPartRegex + '*';

regexes.placeholderVariablePathDotNotation = '\\@@@cxtDot@@@[a-zA-Z_$]+[a-zA-Z0-9_$]*';
regexes.placeholderVariableBracketsNotation = '@@@cxtOpenSquareBracket@@@[^\\]]*@@@cxtCloseSquareBracket@@@';
regexes.placeholderVariablePathFunctionCall = '@@@cxtOpenRoundBracket@@@[^\\)]*@@@cxtCloseRoundBracket@@@';
regexes.placeholderVariablePathPartRegex = '(?:' + regexes.placeholderVariablePathDotNotation + '|' + regexes.placeholderVariableBracketsNotation + '|' + regexes.placeholderVariablePathFunctionCall + ')';
regexes.placeholderContextVariableRegex = '__CXT__' + regexes.placeholderVariablePathPartRegex + '*';
