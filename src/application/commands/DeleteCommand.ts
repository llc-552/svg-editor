import { EditCommand } from './EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class DeleteCommand extends EditCommand {
  readonly syntax = 'delete <id>';
  apply(document: SvgDocument, args: readonly string[]): string {
    Arguments.count(args, 1, 1, this.syntax);
    const label = document.find(args[0]!).label;
    document.delete(args[0]!);
    return `${label} deleted`;
  }
}
