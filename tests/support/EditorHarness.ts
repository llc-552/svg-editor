import assert from 'node:assert/strict';
import { ShapeFactory } from '../../src/domain/ShapeFactory.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { CommandRouter } from '../../src/application/CommandRouter.js';
import { CliEngine } from '../../src/cli/CliEngine.js';
import { XmlSvgCodec } from '../../src/infrastructure/svg/XmlSvgCodec.js';
import { MemoryFileStore } from './MemoryFileStore.js';

export class EditorHarness {
  readonly files = new MemoryFileStore();
  readonly factory = new ShapeFactory();
  readonly codec = new XmlSvgCodec(this.factory);
  readonly session = new EditorSession(this.files, this.codec);
  readonly engine = new CliEngine(new CommandRouter(this.session, this.factory));
  async ok(line: string): Promise<string> {
    const result = await this.engine.execute(line);
    assert.ok(!result.startsWith('error:'), `${line}: ${result}`);
    return result;
  }
  async fails(line: string, match: RegExp): Promise<string> {
    const result = await this.engine.execute(line);
    assert.match(result, /^error: /);
    assert.match(result, match);
    return result;
  }
  async script(source: string): Promise<string[]> {
    const results: string[] = [];
    for (const line of source.split(/\r?\n/)) {
      const result = await this.engine.execute(line);
      if (result) results.push(result);
    }
    return results;
  }
  snapshot(): string { return this.codec.encode(this.session.document()); }
}
