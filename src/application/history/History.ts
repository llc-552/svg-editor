import { HistoryEntry } from './HistoryEntry.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class History {
  private readonly past: HistoryEntry[] = [];
  private readonly future: HistoryEntry[] = [];
  private disabled = true;
  reset(): void { this.past.length = 0; this.future.length = 0; this.disabled = true; }
  record(entry: HistoryEntry): void {
    this.past.push(entry); this.future.length = 0; this.disabled = false;
  }
  undo(): { document: SvgDocument; summary: string } {
    this.allowed();
    const entry = this.past.at(-1);
    if (!entry) throw new Error('nothing to undo');
    const document = entry.undo();
    this.past.pop(); this.future.push(entry);
    return { document, summary: `undone: ${entry.summary}` };
  }
  redo(): { document: SvgDocument; summary: string } {
    this.allowed();
    const entry = this.future.at(-1);
    if (!entry) throw new Error('nothing to redo');
    const document = entry.redo();
    this.future.pop(); this.past.push(entry);
    return { document, summary: `redone: ${entry.summary}` };
  }
  private allowed(): void {
    if (this.disabled) throw new Error('undo not allowed after io command');
  }
}
