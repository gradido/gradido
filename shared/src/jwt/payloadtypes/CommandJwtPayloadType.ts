import { JwtPayloadType } from './JwtPayloadType'

export class CommandJwtPayloadType extends JwtPayloadType {
  static COMMAND_TYPE = 'command'

    commandName: string
    commandClass: string
    commandArgs: string[]

  constructor(handshakeID: string, commandName: string, commandClass: string, commandArgs: string[]) {
    super(handshakeID)
    this.tokentype = CommandJwtPayloadType.COMMAND_TYPE
    this.commandName = commandName
    this.commandClass = commandClass
    this.commandArgs = commandArgs
  }
}
