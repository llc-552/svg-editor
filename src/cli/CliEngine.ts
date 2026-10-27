import type { CommandRouter } from '../application/CommandRouter.js';
import { Tokenizer } from './Tokenizer.js';

export class CliEngine {
  private readonly tokenizer = new Tokenizer();
  constructor(private readonly router: CommandRouter) {}
  async execute(line: string): Promise<string> {
    try {
      const [name, ...args] = this.tokenizer.tokenize(line);
      return name === undefined ? '' : await this.router.execute(name, args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `error: ${message.replace(/[\r\n]+/g, ' ')}`;
    }
  }
}
