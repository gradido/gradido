import { Transaction } from '@entity/Transaction'

import { KeyPair } from '@/data/KeyPair'
import { TransactionBodyBuilder } from '@/data/proto/TransactionBody.builder'
import { TransactionBuilder } from '@/data/Transaction.builder'
import { UserRepository } from '@/data/User.repository'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { sign } from '@/utils/cryptoHelper'

export class TransactionRecipeRole {
  protected transactionBuilder: TransactionBuilder

  public constructor() {
    this.transactionBuilder = new TransactionBuilder()
  }

  public async create(transactionDraft: TransactionDraft): Promise<TransactionRecipeRole> {
    const senderUser = transactionDraft.senderUser
    const recipientUser = transactionDraft.recipientUser

    // loading signing and recipient account
    // TODO: look for ways to use only one db call for both
    const signingAccount = await UserRepository.findAccountByUserIdentifier(senderUser)
    if (!signingAccount) {
      throw new TransactionError(
        TransactionErrorType.NOT_FOUND,
        "couldn't found sender user account in db",
      )
    }
    const recipientAccount = await UserRepository.findAccountByUserIdentifier(recipientUser)
    if (!recipientAccount) {
      throw new TransactionError(
        TransactionErrorType.NOT_FOUND,
        "couldn't found recipient user account in db",
      )
    }
    // create proto transaction body
    const transactionBodyBuilder = new TransactionBodyBuilder()
      .setSigningAccount(signingAccount)
      .setRecipientAccount(recipientAccount)
      .fromTransactionDraft(transactionDraft)
    // build transaction entity

    this.transactionBuilder
      .fromTransactionBodyBuilder(transactionBodyBuilder)
      .setBackendTransactionId(transactionDraft.backendTransactionId)
    await this.transactionBuilder.setSenderCommunityFromSenderUser(senderUser)
    if (recipientUser.communityUuid !== senderUser.communityUuid) {
      await this.transactionBuilder.setRecipientCommunityFromRecipientUser(recipientUser)
    }
    const transaction = this.transactionBuilder.getTransaction()
    // sign
    this.transactionBuilder.setSignature(
      sign(transaction.bodyBytes, new KeyPair(this.transactionBuilder.getSenderCommunity())),
    )
    return this
  }

  public getTransaction(): Transaction {
    return this.transactionBuilder.getTransaction()
  }
}
