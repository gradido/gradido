import { Transaction } from '@entity/Transaction'
import { IsNull } from 'typeorm'

import { getDataSource } from '@/typeorm/DataSource'

// https://www.artima.com/articles/the-dci-architecture-a-new-vision-of-object-oriented-programming
export const TransactionRepository = getDataSource()
  .getRepository(Transaction)
  .extend({
    findBySignature(signature: Buffer): Promise<Transaction | null> {
      return this.findOneBy({ signature: Buffer.from(signature) })
    },
    findByMessageId(iotaMessageId: string): Promise<Transaction | null> {
      return this.findOneBy({ iotaMessageId: Buffer.from(iotaMessageId, 'hex') })
    },
    async getNextPendingTransaction(): Promise<Transaction | null> {
      return await this.findOne({
        where: { iotaMessageId: IsNull() },
        order: { createdAt: 'ASC' },
        relations: { signingAccount: true },
      })
    },
    findExistingTransactionAndMissingMessageIds(messageIDsHex: string[]): Promise<Transaction[]> {
      return this.createQueryBuilder('Transaction')
        .where('HEX(Transaction.iota_message_id) IN (:...messageIDs)', {
          messageIDs: messageIDsHex,
        })
        .leftJoinAndSelect('Transaction.community', 'Community')
        .leftJoinAndSelect('Transaction.otherCommunity', 'OtherCommunity')
        .leftJoinAndSelect('Transaction.recipientAccount', 'RecipientAccount')
        .leftJoinAndSelect('Transaction.backendTransactions', 'BackendTransactions')
        .leftJoinAndSelect('RecipientAccount.user', 'RecipientUser')
        .leftJoinAndSelect('Transaction.signingAccount', 'SigningAccount')
        .leftJoinAndSelect('SigningAccount.user', 'SigningUser')
        .getMany()
    },
    removeConfirmedTransaction(transactions: Transaction[]): Transaction[] {
      return transactions.filter(
        (transaction: Transaction) =>
          transaction.runningHash === undefined || transaction.runningHash.length === 0,
      )
    },
  })
