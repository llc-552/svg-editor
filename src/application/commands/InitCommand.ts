import type { Command } from './Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';

export class InitCommand implements Command {
  readonly syntax = 'init [w] [h]';
  execute(session: EditorSession, args: readonly string[]): string {
    Arguments.count(args, 0, 2, this.syntax);
    return session.init(args[0] === undefined ? 800 : Arguments.number(args, 0), args[1] === undefined ? 600 : Arguments.number(args, 1));
  }
}
