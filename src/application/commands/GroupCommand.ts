import { EditCommand } from './EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';

export class GroupCommand extends EditCommand {
  readonly syntax = 'group <newGid> <id1> [id2...]';
  apply(document: SvgDocument, args: readonly string[]): string {
    Arguments.count(args, 2, Infinity, this.syntax);
    document.group(args[0]!, args.slice(1));
    return `g#${args[0]} created with ${args.length - 1} children`;
  }
}
