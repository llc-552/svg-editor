import { EditCommand } from './EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class ScaleCommand extends EditCommand {
  readonly syntax = 'scale <id> <factor>';
  apply(document: SvgDocument, args: readonly string[]): string {
    Arguments.count(args, 2, 2, this.syntax);
    const shape = document.find(args[0]!);
    const factor = Arguments.number(args, 1);
    shape.scale(factor);
    return `${shape.label} scaled by ${factor}`;
  }
}
