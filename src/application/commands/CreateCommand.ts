import { EditCommand } from './EditCommand.js';
import { Arguments } from '../Arguments.js';
import { ShapeFactory } from '../../domain/ShapeFactory.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class CreateCommand extends EditCommand {
  readonly syntax = 'create <type> <id> [params...] [in <containerId>]';
  constructor(private readonly factory: ShapeFactory) { super(); }
  apply(document: SvgDocument, args: readonly string[]): string {
    Arguments.count(args, 2, Infinity, this.syntax);
    const parameters = args.slice(2);
    let parent: string | undefined;
    if (parameters.length >= 2 && parameters.at(-2) === 'in') {
      parent = parameters.pop()!; parameters.pop();
    }
    if (document.has(args[1]!)) throw new Error(`id already exists: ${args[1]}`);
    const shape = this.factory.create(args[0]!, args[1]!, parameters);
    document.add(shape, parent);
    return `${shape.label} created${parent === undefined ? '' : ` in g#${parent}`}`;
  }
}
