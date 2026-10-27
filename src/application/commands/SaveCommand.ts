import type { Command } from './Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';

export class SaveCommand implements Command {
  readonly syntax = 'save [file.svg]';
  execute(session: EditorSession, args: readonly string[]): Promise<string> {
    Arguments.count(args, 0, 1, this.syntax);
    return session.save(args[0]);
  }
}
