import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { CliEngine } from './CliEngine.js';

export class Repl {
  constructor(private readonly engine: CliEngine) {}
  async run(input: Readable = process.stdin, output: Writable = process.stdout, interactive = !!process.stdin.isTTY): Promise<void> {
    const lines = createInterface({ input, crlfDelay: Infinity, terminal: interactive, output });
    if (interactive) output.write("svg-editor 0.1 — type 'help' for commands\n");
    if (interactive) { lines.setPrompt('svg> '); lines.prompt(); }
    for await (const line of lines) {
      const result = await this.engine.execute(line);
      if (result) output.write(result + '\n');
      if (interactive) lines.prompt();
    }
  }
}
