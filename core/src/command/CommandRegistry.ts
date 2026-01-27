// core/src/command/CommandRegistry.ts
import { ICommand } from './CommandTypes';

export class CommandRegistry {
  private static instance: CommandRegistry;
  private commands: Map<string, new (params: any) => ICommand> = new Map();

  private constructor() {}

  static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  static registerCommand(type: string, commandClass: new (params: any) => ICommand): void {
    this.getInstance().commands.set(type, commandClass);
  }

  static getCommandClass(type: string): (new (params: any) => ICommand) | undefined {
    return this.getInstance().commands.get(type);
  }
}
