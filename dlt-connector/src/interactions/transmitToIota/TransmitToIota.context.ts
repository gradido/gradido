import { Transaction } from '@entity/Transaction'

import { CrossGroupType } from '@/data/proto/3_3/enum/CrossGroupType'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { LogError } from '@/server/LogError'

import { AbstractTransactionRecipeRole } from './AbstractTransactionRecipe.role'
import { InboundTransactionRecipeRole } from './InboundTransactionRecipe.role'
import { LocalTransactionRecipeRole } from './LocalTransactionRecipe.role'
import { OutboundTransactionRecipeRole } from './OutboundTransactionRecipeRole'

/**
 * @DCI-Context
 * Context for sending transaction recipe to iota
 * send every transaction only once to iota!
 */
export class TransmitToIotaContext {
  private transactionRecipeRole: AbstractTransactionRecipeRole

  public constructor(transaction: Transaction) {
    const transactionBody = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    switch (transactionBody.type) {
      case CrossGroupType.LOCAL:
        this.transactionRecipeRole = new LocalTransactionRecipeRole(transaction)
        break
      case CrossGroupType.INBOUND:
        this.transactionRecipeRole = new InboundTransactionRecipeRole(transaction)
        break
      case CrossGroupType.OUTBOUND:
        this.transactionRecipeRole = new OutboundTransactionRecipeRole(transaction)
        break
      default:
        throw new LogError('unknown cross group type', transactionBody.type)
    }
  }

  public async run(): Promise<void> {
    const transaction = await this.transactionRecipeRole.transmitToIota()
    // store changes in db
    await transaction.save()
  }
}
