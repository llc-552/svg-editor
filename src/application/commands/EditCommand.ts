import type { Command } from './Command.js';
import type { EditorSession } from '../EditorSession.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export abstract class EditCommand implements Command {
  abstract readonly syntax: string;
  execute(session: EditorSession, args: readonly string[]): string { return session.edit(this, args); }
  abstract apply(document: SvgDocument, args: readonly string[]): string;
}
