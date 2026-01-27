import { Command } from './Command';
import { BaseCommand } from './BaseCommand';

export class CommandFactory {
  private static instance: CommandFactory;
  private commands: Map<string, new (params: any) => Command> = new Map();

  private constructor() {}

  static getInstance(): CommandFactory {
    if (!CommandFactory.instance) {
      CommandFactory.instance = new CommandFactory();
    }
    return CommandFactory.instance;
  }

  registerCommand(name: string, commandClass: new (params: any) => Command): void {
    this.commands.set(name, commandClass);
  }

  createCommand<T>(name: string, params: any = {}): Command<T> {
    const CommandClass = this.commands.get(name);
    if (!CommandClass) {
      throw new Error(`Command ${name} not found`);
    }
    return new CommandClass(params) as Command<T>;
  }
}
