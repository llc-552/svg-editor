export class Tokenizer {
  tokenize(line: string): string[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let value = '', quoted = false, started = false;
    for (let index = 0; index < line.length; index++) {
      const character = line[index]!;
      if (quoted && character === '\\' && ['"', '\\'].includes(line[index + 1] ?? '')) {
        value += line[++index]; started = true;
      } else if (character === '"') {
        quoted = !quoted; started = true;
      } else if (!quoted && /\s/.test(character)) {
        if (started) { tokens.push(value); value = ''; started = false; }
      } else { value += character; started = true; }
    }
    if (quoted) throw new Error('unterminated double quote');
    if (started) tokens.push(value);
    return tokens;
  }
}
