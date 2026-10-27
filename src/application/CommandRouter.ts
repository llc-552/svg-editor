import type { Command } from './commands/Command.js';
import type { EditorSession } from './EditorSession.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { InitCommand } from './commands/InitCommand.js';
import { ReadCommand } from './commands/ReadCommand.js';
import { SaveCommand } from './commands/SaveCommand.js';
import { CanvasCommand } from './commands/CanvasCommand.js';
import { CreateCommand } from './commands/CreateCommand.js';
import { DeleteCommand } from './commands/DeleteCommand.js';
import { MoveCommand } from './commands/MoveCommand.js';
import { ScaleCommand } from './commands/ScaleCommand.js';
import { SetCommand } from './commands/SetCommand.js';
import { GroupCommand } from './commands/GroupCommand.js';
import { UngroupCommand } from './commands/UngroupCommand.js';
import { AddToCommand } from './commands/AddToCommand.js';
import { FrontCommand } from './commands/FrontCommand.js';
import { BackCommand } from './commands/BackCommand.js';
import { TreeCommand } from './commands/TreeCommand.js';
import { ShowCommand } from './commands/ShowCommand.js';
import { UndoCommand } from './commands/UndoCommand.js';
import { RedoCommand } from './commands/RedoCommand.js';
import { HelpCommand } from './commands/HelpCommand.js';

export class CommandRouter {
  // The single command-name dispatch point; provider registration is future work.
  private readonly commands = new Map<string, Command>();
  constructor(private readonly session: EditorSession, factory: ShapeFactory) {
    const commands: Command[] = [
      new InitCommand(), new ReadCommand(), new SaveCommand(), new CanvasCommand(),
      new CreateCommand(factory), new DeleteCommand(), new MoveCommand(), new ScaleCommand(),
      new SetCommand(), new GroupCommand(), new UngroupCommand(), new AddToCommand(),
      new FrontCommand(), new BackCommand(), new TreeCommand(), new ShowCommand(),
      new UndoCommand(), new RedoCommand(), new HelpCommand(() => [...this.commands.values()].map(command => command.syntax)),
    ];
    for (const command of commands) this.commands.set(command.syntax.split(' ')[0]!, command);
  }
  async execute(name: string, args: readonly string[]): Promise<string> {
    const command = this.commands.get(name);
    if (!command) throw new Error(`unknown command: ${name}`);
    if (!['init', 'read', 'help'].includes(name)) this.session.document();
    return command.execute(this.session, args);
  }
}
