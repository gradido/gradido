import { AccountRepository } from '@/data/Account.repository'
import { KeyPair } from '@/data/KeyPair'
import { TransactionBuilder } from '@/data/Transaction.builder'
import { TransactionBodyBuilder } from '@/data/proto/TransactionBody.builder'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { sign } from '@/utils/cryptoHelper'
import { Transaction } from '@entity/Transaction'

export class TransactionRecipeRole {
  protected transactionBuilder: TransactionBuilder
  construct() {
    this.transactionBuilder = new TransactionBuilder()
  }

  public async create(transactionDraft: TransactionDraft): Promise<TransactionRecipeRole> {
    const senderUser = transactionDraft.senderUser
    const recipientUser = transactionDraft.recipientUser

    // loading signing and recipient account
    // TODO: look for ways to use only one db call for both
    const signingAccount = await AccountRepository.findAccountByUserIdentifier(senderUser)
    if (!signingAccount) {
      throw new TransactionError(
        TransactionErrorType.NOT_FOUND,
        "couldn't found sender user account in db",
      )
    }
    const recipientAccount = await AccountRepository.findAccountByUserIdentifier(recipientUser)
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
    if (recipientUser.uuid !== senderUser.uuid) {
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
