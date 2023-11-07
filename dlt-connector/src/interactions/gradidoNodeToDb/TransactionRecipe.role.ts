import { TransactionBuilder } from '@/data/Transaction.builder'
import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { LogError } from '@/server/LogError'
import { Transaction } from '@entity/Transaction'

export class TransactionRecipeRole {
  // eslint-disable-next-line no-useless-constructor
  constructor(private self: Transaction) {}

  static async createFromGradidoTransaction(
    gradidoTransaction: GradidoTransaction,
  ): Promise<TransactionRecipeRole> {
    const transactionBuilder = new TransactionBuilder()
    await transactionBuilder.fromGradidoTransactionSearchForAccounts(gradidoTransaction)
    return new TransactionRecipeRole(transactionBuilder.build())
  }

  public setIotaMessageId(iotaMessageId: string): void {
    this.self.iotaMessageId = Buffer.from(iotaMessageId, 'hex')
  }

  public hasIotaMessageId(): boolean {
    return this.self.iotaMessageId?.length === 32
  }

  public getIotaMessageIdHex(): string {
    if (!this.self.iotaMessageId || !this.hasIotaMessageId()) {
      throw new LogError('missing iota message id')
    }
    return this.self.iotaMessageId.toString('hex')
  }

  public isAlreadyConfirmed(): boolean {
    return this.self.runningHash?.length === 32
  }
}

/*
recipeEntity.signingAccount =
      signingAccount ?? (await findAccountByPublicKey(firstSigPair.pubKey))
    recipeEntity.signature = Buffer.from(firstSigPair.signature)
    recipeEntity.recipientAccount =
      recipientAccount ?? (await findAccountByPublicKey(body.getRecipientPublicKey()))
*/
