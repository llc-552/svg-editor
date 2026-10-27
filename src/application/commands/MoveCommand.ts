import { EditCommand } from './EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class MoveCommand extends EditCommand {
  readonly syntax = 'move <id> <dx> <dy>';
  apply(document: SvgDocument, args: readonly string[]): string {
    Arguments.count(args, 3, 3, this.syntax);
    const shape = document.find(args[0]!);
    const dx = Arguments.number(args, 1), dy = Arguments.number(args, 2);
    shape.move(dx, dy);
    return `${shape.label} moved by (${dx},${dy})`;
  }
}
