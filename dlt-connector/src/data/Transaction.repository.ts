import { Brackets, Not } from '@dbTools/typeorm'
import { Account } from '@entity/Account'
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
    findExistingTransactions(messageIDsHex: string[]): Promise<Transaction[]> {
      return this.createQueryBuilder('Transaction')
        .where('HEX(Transaction.iota_message_id) IN (:...messageIDs)', {
          messageIDs: messageIDsHex,
        })
        .leftJoinAndSelect('Transaction.recipientAccount', 'RecipientAccount')
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

    async getLastConfirmedTransactionForCommunity(
      communityId: number,
    ): Promise<Transaction | null> {
      return this.findOne({
        where: { communityId, runningHash: Not(IsNull()) },
        order: { nr: 'DESC' },
      })
    },

    async getLastTransactionForBalanceAccount({ id }: Account): Promise<Transaction | null> {
      // check TransactionLogic.getBalanceAccount for reference
      // TODO: find a war to get the actual logic from TransactionLogic
      // TODO: update for deferred transfer
      const queryBuilder = this.createQueryBuilder('transactions')
      queryBuilder.where({ confirmedAt: Not(IsNull()) }).andWhere(
        new Brackets((qb) => {
          qb.where({ type: 2, recipientAccountId: id })
          qb.orWhere({ type: 1, senderAccountId: id })
        }),
      )
      return queryBuilder.getOne()
    },
  })
