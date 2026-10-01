import { Command } from './Command'

export interface ICommandConstructor<T = any> {
  // `requestingPublicKey`: the key of the community that sealed the command, for a command that
  // checks who it comes from (EditChatMessageCommand).
  new (params: any, requestingPublicKey?: string): Command<T>
}
