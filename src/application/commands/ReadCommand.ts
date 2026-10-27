import type { Command } from './Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';

export class ReadCommand implements Command {
  readonly syntax = 'read <file.svg>';
  execute(session: EditorSession, args: readonly string[]): Promise<string> {
    Arguments.count(args, 1, 1, this.syntax);
    return session.read(args[0]!);
  }
}
