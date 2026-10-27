import { EditCommand } from './EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class SetCommand extends EditCommand {
  readonly syntax = 'set <id> <attr> <value>';
  apply(document: SvgDocument, args: readonly string[]): string {
    Arguments.count(args, 3, 3, this.syntax);
    const shape = document.find(args[0]!);
    shape.set(args[1]!, args[2]!);
    return `${shape.label} updated: ${args[1]}=${JSON.stringify(args[2])}`;
  }
}
