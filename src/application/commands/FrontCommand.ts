import { EditCommand } from './EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class FrontCommand extends EditCommand {
  readonly syntax = 'front <id>';
  apply(document: SvgDocument, args: readonly string[]): string {
    Arguments.count(args, 1, 1, this.syntax);
    document.reorder(args[0]!, true);
    return `${document.find(args[0]!).label} moved to front`;
  }
}
