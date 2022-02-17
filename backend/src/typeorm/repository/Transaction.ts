import { EntityRepository, Repository } from '@dbTools/typeorm'
import { Transaction } from '@entity/Transaction'

@EntityRepository(Transaction)
export class TransactionRepository extends Repository<Transaction> {
  async joinFullTransactionsByIds(transactionIds: number[]): Promise<Transaction[]> {
    return this.createQueryBuilder('transaction')
      .where('transaction.id IN (:...transactions)', { transactions: transactionIds })
      .leftJoinAndSelect(
        'transaction.transactionSendCoin',
        'transactionSendCoin',
        // 'transactionSendCoin.transaction_id = transaction.id',
      )
      .leftJoinAndSelect(
        'transaction.transactionCreation',
        'transactionCreation',
        // 'transactionSendCoin.transaction_id = transaction.id',
      )
      .getMany()
  }
}
