// backend/src/graphql/resolver/CommandResolver.ts
import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import { CommandExecutor } from '../../command/CommandExecutor';
import { CommandResult } from '../model/CommandResult';
import { EncryptedTransferArgs } from '../model/EncryptedTransferArgs';

@Resolver()
export class CommandResolver {
  private commandExecutor = new CommandExecutor();

  @Mutation(() => CommandResult)
  async executeCommand(
    @Arg('encryptedArgs', () => EncryptedTransferArgs) encryptedArgs: any,
    @Ctx() context: any
  ): Promise<CommandResult> {
    // Convert to EncryptedTransferArgs if needed
    const result = await this.commandExecutor.executeEncryptedCommand(encryptedArgs);
    return result as unknown as CommandResult;
  }
}
