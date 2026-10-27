import { EditCommand } from './EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class UngroupCommand extends EditCommand {
  readonly syntax = 'ungroup <gid>';
  apply(document: SvgDocument, args: readonly string[]): string {
    Arguments.count(args, 1, 1, this.syntax);
    document.ungroup(args[0]!);
    return `g#${args[0]} ungrouped`;
  }
}
