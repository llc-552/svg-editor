import { Numeric } from '../domain/Numeric.js';

export class Arguments {
  static count(args: readonly string[], minimum: number, maximum: number, syntax: string): void {
    if (args.length < minimum || args.length > maximum) throw new Error(`usage: ${syntax}`);
  }
  static number(args: readonly string[], index: number): number {
    return Numeric.parse(args[index]!);
  }
}
