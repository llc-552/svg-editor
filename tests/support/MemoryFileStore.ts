import type { FileStore } from '../../src/application/ports/FileStore.js';

export class MemoryFileStore implements FileStore {
  readonly files = new Map<string, string>();
  failWrites = false;
  async read(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) throw new Error('missing file');
    return content;
  }
  async write(path: string, content: string): Promise<void> {
    if (this.failWrites) throw new Error('disk unavailable');
    this.files.set(path, content);
  }
}
