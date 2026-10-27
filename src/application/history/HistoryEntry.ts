import type { SvgDocument } from '../../domain/SvgDocument.js';
import type { EditCommand } from '../commands/EditCommand.js';

export class HistoryEntry {
  private readonly before: SvgDocument;
  private readonly after: SvgDocument;
  constructor(readonly command: EditCommand, before: SvgDocument, after: SvgDocument, readonly summary: string) {
    this.before = before.clone();
    this.after = after.clone();
  }
  undo(): SvgDocument { return this.before.clone(); }
  redo(): SvgDocument { return this.after.clone(); }
}
