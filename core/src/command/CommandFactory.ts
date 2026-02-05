import { Command } from './Command';
import { BaseCommand } from './BaseCommand';
import { getLogger } from 'log4js';
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const';

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.command.CommandFactory.${method}`)

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
    const methodLogger = createLogger(`registerCommand`)
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`registerCommand() name=${name}`)
    }
    this.commands.set(name, commandClass);
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`registerCommand() commands=${JSON.stringify(Array.from(this.commands.entries()))}`)
    }
  }

  createCommand<T>(name: string, params: any = {}): Command<T> {
    const methodLogger = createLogger(`createCommand`)
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`createCommand() name=${name} params=${JSON.stringify(params)}`)
    }
    const CommandClass = this.commands.get(name);
    if (!CommandClass) {
      const errmsg = `Command ${name} not found`;
      methodLogger.error(errmsg);
      throw new Error(errmsg);
    }
    const command = new CommandClass(params) as Command<T>;
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`createCommand() command=${JSON.stringify(command)}`)
    }
    return command;
  }
}
