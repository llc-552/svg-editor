import { EditCommand } from './EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class AddToCommand extends EditCommand {
  readonly syntax = 'addto <gid> <id>';
  apply(document: SvgDocument, args: readonly string[]): string {
    Arguments.count(args, 2, 2, this.syntax);
    document.addTo(args[0]!, args[1]!);
    return `${document.find(args[1]!).label} added to g#${args[0]}`;
  }
}
