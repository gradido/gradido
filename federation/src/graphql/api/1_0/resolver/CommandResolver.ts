import { CommandExecutor, CommandResult, EncryptedTransferArgs } from 'core'
import { Arg, Ctx, Mutation, Resolver } from 'type-graphql'

@Resolver()
export class CommandResolver {
  private commandExecutor = new CommandExecutor()

  @Mutation(() => CommandResult)
  async sendCommand(
    @Arg('encryptedArgs', () => EncryptedTransferArgs) encryptedArgs: any,
    @Ctx() context: any,
  ): Promise<CommandResult> {
    // Convert to EncryptedTransferArgs if needed
    const result = await this.commandExecutor.executeEncryptedCommand(encryptedArgs)
    return result as unknown as CommandResult
  }
}
