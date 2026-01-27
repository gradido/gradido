// backend/src/graphql/resolver/CommandResolver.ts
import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import { CommandExecutor } from '../../command/CommandExecutor';
import { CommandResult } from '../model/CommandResult';

@Resolver()
export class CommandResolver {
  private commandExecutor = new CommandExecutor();

  @Mutation(() => CommandResult)
  async executeCommand(
    @Arg('encryptedArgs', () => Object) encryptedArgs: any,
    @Ctx() context: any
  ): Promise<CommandResult> {
    // Convert to EncryptedTransferArgs if needed
    const result = await this.commandExecutor.executeEncryptedCommand(encryptedArgs);
    return result as unknown as CommandResult;
  }
}
