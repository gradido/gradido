
import { Arg, Mutation, Resolver } from 'type-graphql'
import { ConfirmedTransactionInput } from '../input/ConfirmedTransactionInput'
import { InvalidTransactionInput } from '../input/InvalidTransactionInput'
import { MutationResult } from 'core'

@Resolver()
export class BlockchainNotificationResolver {
  @Mutation(() => MutationResult)
  async blockchainConfirmedTx(@Arg('data') args: ConfirmedTransactionInput): Promise<MutationResult> {
    console.log('Blockchain notification received:', JSON.stringify(args, null, 2))
    return { success: true }
  }
  
  @Mutation(() => MutationResult)
  async blockchainRejectedTx(@Arg('data') args: InvalidTransactionInput): Promise<MutationResult> {
    console.log('Blockchain notification received:', JSON.stringify(args, null, 2))
    return { success: true }
  }
}
