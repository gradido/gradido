import { Command } from './Command';
import { BaseCommand } from './BaseCommand';
import { getLogger } from 'log4js';
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const';
import { ICommandConstructor } from './CommandTypes';
import { SendEmailCommand } from './commands/SendEmailCommand';

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.command.CommandFactory.${method}`)

export class CommandFactory {
  private static instance: CommandFactory;
  private commands: Map<string, ICommandConstructor> = new Map();

  private constructor() {}

  static getInstance(): CommandFactory {
    if (!CommandFactory.instance) {
      CommandFactory.instance = new CommandFactory();
    }
    return CommandFactory.instance;
  }

  registerCommand<T>(name: string, commandClass: ICommandConstructor<T>): void {
    const methodLogger = createLogger(`registerCommand`)
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`registerCommand() name=${name}, commandClass=${commandClass.name}`)
    }
    this.commands.set(name, commandClass);
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`registerCommand() commands=${JSON.stringify(this.commands.entries())}`)
    }
  }

  createCommand<T>(name: string, params: any = {}): Command<T> {
    const methodLogger = createLogger(`createCommand`)
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`createCommand() name=${name} params=${JSON.stringify(params)}`)
    }
    const CommandClass = this.commands.get(name);
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`createCommand() name=${name} commandClass=${CommandClass ? CommandClass.name : 'null'}`)
    }
    if (CommandClass === undefined) {
      const errmsg = `Command ${name} not found`;
      methodLogger.error(errmsg);
      throw new Error(errmsg);
    }
    /*
    try {
      const command = new CommandClass(params) as Command<T>;
      if (methodLogger.isDebugEnabled()) {
        methodLogger.debug(`createCommand() command=${JSON.stringify(command)}`)
      }
      return command;
    } catch (error) {
      const errmsg = `Failed to create command ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      methodLogger.error(errmsg);
      throw new Error(errmsg);
    }
    */
   let command: BaseCommand;
   switch(CommandClass.name) {
    case 'SendEmailCommand':
      command = new SendEmailCommand(params);
      break;
    default:
      const errmsg = `Command ${name} not found`;
      methodLogger.error(errmsg);
      throw new Error(errmsg);  
   }
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`createCommand() created command=${JSON.stringify(command)}`)
    }
    return command
  }
}
