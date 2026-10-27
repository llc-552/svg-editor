import type { EditorSession } from '../EditorSession.js';

export interface Command {
  readonly syntax: string;
  execute(session: EditorSession, args: readonly string[]): string | Promise<string>;
}
