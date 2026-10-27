import type { Command } from './Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';

export class CanvasCommand implements Command {
  readonly syntax = 'canvas [w h]';
  execute(session: EditorSession, args: readonly string[]): string {
    Arguments.count(args, 0, 2, this.syntax);
    if (args.length === 1) throw new Error(`usage: ${this.syntax}`);
    if (args.length === 2) return session.resize(Arguments.number(args, 0), Arguments.number(args, 1));
    const document = session.document();
    return `canvas ${document.width}x${document.height}`;
  }
}
