import { SvgDocument } from '../domain/SvgDocument.js';
import { History } from './history/History.js';
import { HistoryEntry } from './history/HistoryEntry.js';
import type { EditCommand } from './commands/EditCommand.js';
import type { FileStore } from './ports/FileStore.js';
import type { SvgCodec } from './ports/SvgCodec.js';

export class EditorSession {
  private current: SvgDocument | undefined;
  private path: string | undefined;
  private readonly history = new History();
  constructor(private readonly files: FileStore, private readonly codec: SvgCodec) {}
  document(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  init(width: number, height: number): string {
    const document = new SvgDocument(width, height);
    this.current = document; this.path = undefined; this.history.reset();
    return `canvas ${width}x${height} created`;
  }
  edit(command: EditCommand, args: readonly string[]): string {
    const before = this.document();
    const candidate = before.clone();
    const summary = command.apply(candidate, args);
    const entry = new HistoryEntry(command, before, candidate, summary);
    this.current = candidate;
    this.history.record(entry);
    return summary;
  }
  resize(width: number, height: number): string {
    const candidate = this.document().clone();
    candidate.resize(width, height);
    this.current = candidate; this.history.reset();
    return `canvas resized to ${width}x${height}`;
  }
  undo(): string {
    const result = this.history.undo(); this.current = result.document; return result.summary;
  }
  redo(): string {
    const result = this.history.redo(); this.current = result.document; return result.summary;
  }
  async read(path: string): Promise<string> {
    let source: string;
    try { source = await this.files.read(path); }
    catch { throw new Error(`cannot read file: ${path}`); }
    const result = this.codec.decode(source);
    this.current = result.document; this.path = path; this.history.reset();
    return [...result.warnings, `read ${path} (${result.document.size} elements)`].join('\n');
  }
  async save(path?: string): Promise<string> {
    const document = this.document();
    const destination = path ?? this.path;
    if (!destination) throw new Error('no file path. use save <file.svg>');
    const source = this.codec.encode(document);
    try { await this.files.write(destination, source); }
    catch { throw new Error(`cannot write file: ${destination}`); }
    this.path = destination; this.history.reset();
    return `saved to ${destination} (${document.size} elements)`;
  }
}
