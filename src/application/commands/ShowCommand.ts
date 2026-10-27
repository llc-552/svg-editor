import type { Command } from './Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';
import { DocumentPresenter } from '../DocumentPresenter.js';

export class ShowCommand implements Command {
  readonly syntax = 'show <id>';
  execute(session: EditorSession, args: readonly string[]): string {
    Arguments.count(args, 1, 1, this.syntax);
    return new DocumentPresenter().show(session.document(), args[0]!);
  }
}
