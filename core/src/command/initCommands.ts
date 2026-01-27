import { CommandFactory } from './CommandFactory';
import { SendEmailCommand } from './commands/SendEmailCommand';
// Import other commands...

export function initializeCommands(): void {
  const factory = CommandFactory.getInstance();
  
  // Register all commands
  factory.registerCommand(SendEmailCommand.SEND_MAIL_COMMAND, SendEmailCommand);
  // Register other commands...
  }
