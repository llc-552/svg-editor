import type { Command } from './Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';

export class UndoCommand implements Command {
  readonly syntax = 'undo';
  execute(session: EditorSession, args: readonly string[]): string {
    Arguments.count(args, 0, 0, this.syntax);
    return session.undo();
  }
}
