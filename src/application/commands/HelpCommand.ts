import type { Command } from './Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';

export class HelpCommand implements Command {
  readonly syntax = 'help';
  constructor(private readonly commands: () => readonly string[]) {}
  execute(_session: EditorSession, args: readonly string[]): string {
    Arguments.count(args, 0, 0, this.syntax);
    return [
      ...this.commands(), '',
      'Shape parameters:',
      '  rect <id> <x> <y> <w> <h> [fill]',
      '  circle <id> <cx> <cy> <r> [fill]',
      '  ellipse <id> <cx> <cy> <rx> <ry> [fill]',
      '  line <id> <x1> <y1> <x2> <y2> [stroke]',
      '  text <id> <x> <y> "content"',
      '  g <id>',
      'Every create supports a trailing in <containerId>.',
      'Whole lines starting with # are comments. End input with Ctrl+D (Windows: Ctrl+Z then Enter).',
    ].join('\n');
  }
}
