import { CommandFactory } from './CommandFactory'
import { EditChatMessageCommand } from './commands/EditChatMessageCommand'
import { SendEmailCommand } from './commands/SendEmailCommand'
// Import other commands...

export function initializeCommands(): void {
  const factory = CommandFactory.getInstance()

  // Register all commands
  factory.registerCommand(SendEmailCommand.SEND_MAIL_COMMAND, SendEmailCommand)
  factory.registerCommand(EditChatMessageCommand.EDIT_CHAT_MESSAGE_COMMAND, EditChatMessageCommand)
  // Register other commands...
}
