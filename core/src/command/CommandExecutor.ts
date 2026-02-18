// core/src/command/CommandExecutor.ts
import { CommandJwtPayloadType } from 'shared';
import { interpretEncryptedTransferArgs } from '../graphql/logic/interpretEncryptedTransferArgs';
import { EncryptedTransferArgs } from '../graphql/model/EncryptedTransferArgs';
import { BaseCommand } from './BaseCommand';
import { Command } from './Command';
import { getLogger } from 'log4js';
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const';
import { CommandFactory } from './CommandFactory';
import { CommandResult } from '../graphql/model/CommandResult';

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.command.CommandExecutor.${method}`)

export class CommandExecutor {
  async executeCommand<T>(command: Command<T>): Promise<CommandResult> {
    const methodLogger = createLogger(`executeCommand`)
    methodLogger.debug(`executeCommand() command=${command.constructor.name}`)
    try {
      if (command.validate && !command.validate()) {
        const errmsg = `Command validation failed for command=${command.constructor.name}`
        methodLogger.error(errmsg)
        return { success: false, error: errmsg };
      }
      methodLogger.debug(`executeCommand() executing command=${command.constructor.name}`)
      const result = await command.execute();
      // "accepted":["stage5@gradido.net"],"rejected":[],"ehlo":["PIPELINING","SIZE 25600000","ETRN","AUTH DIGEST-MD5 CRAM-MD5 PLAIN LOGIN","ENHANCEDSTATUSCODES","8BITMIME","DSN","CHUNKING"],"envelopeTime":25,"messageTime":146,"messageSize":37478,"response":"250 2.0.0 Ok: queued as 14B46100B7F","envelope":{"from":"stage5@gradido.net","to":["stage5@gradido.net"]}
      const resultMsg = this.isEmailResult(result) ? {
        accepted: result.accepted,
        messageSize: result.messageSize,
        response: result.response,
        envelope: result.envelope,
      } : {
        accepted: [],
        messageSize: 0,
        response: JSON.stringify(result),
        envelope: null
      };
      methodLogger.debug(`executeCommand() executed result=${JSON.stringify(resultMsg)}`)
      return { success: true, data: JSON.stringify(resultMsg) };
    } catch (error) {
      methodLogger.error(`executeCommand() error=${error}`)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async executeEncryptedCommand<T>(
    encryptedArgs: EncryptedTransferArgs
  ): Promise<CommandResult> {
    const methodLogger = createLogger(`executeEncryptedCommand`)
    try {
      // Decrypt the command data
      const commandArgs = (await interpretEncryptedTransferArgs(encryptedArgs)) as CommandJwtPayloadType
      if (!commandArgs) {
        const errmsg = `invalid commandArgs payload of requesting community with publicKey=${encryptedArgs.publicKey}`
        methodLogger.error(errmsg)
        throw new Error(errmsg)
      }
      if (methodLogger.isDebugEnabled()) {
        methodLogger.debug(`executeEncryptedCommand() commandArgs=${JSON.stringify(commandArgs)}`)
      }
      const command = CommandFactory.getInstance().createCommand(commandArgs.commandName, commandArgs.commandArgs);
      if (methodLogger.isDebugEnabled()) {
        methodLogger.debug(`executeEncryptedCommand() command=${JSON.stringify(command)}`)
      }
      
      // Execute the command
      const result = await this.executeCommand(command);
      if (methodLogger.isDebugEnabled()) {
        methodLogger.debug(`executeCommand() result=${JSON.stringify(result)}`)
      }
      
      return result
    } catch (error) {
      methodLogger.error(`executeEncryptedCommand() error=${error}`)
      const errorResult: CommandResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process command'
      };
      return errorResult;
    }
  }

  private isEmailResult(result: any): result is {
    accepted: string[];
    messageSize: number;
    response: string;
    envelope: any;
  } {
    return result && 
      typeof result === 'object' &&
      Array.isArray(result.accepted) &&
      typeof result.messageSize === 'number' &&
      typeof result.response === 'string' &&
      typeof result.envelope === 'object';
  }

}
