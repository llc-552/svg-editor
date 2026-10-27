import type { Command } from './Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';
import { DocumentPresenter } from '../DocumentPresenter.js';

export class TreeCommand implements Command {
  readonly syntax = 'tree [id]';
  execute(session: EditorSession, args: readonly string[]): string {
    Arguments.count(args, 0, 1, this.syntax);
    return new DocumentPresenter().tree(session.document(), args[0]);
  }
}
