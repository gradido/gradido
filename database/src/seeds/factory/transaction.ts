import { TransactionInterface } from '../transaction/TransactionInterface'
import { Transaction as DbTransaction } from '../../entity'

export async function transactionFactory(transaction: TransactionInterface)
: Promise<DbTransaction> {
  const dbTransaction = new DbTransaction()
  dbTransaction.userId = transaction.sender.id
  dbTransaction.amount = transaction.amount
  dbTransaction.balanceDate = transaction.creationDate
  dbTransaction.memo = transaction.memo
  dbTransaction.typeId = transaction.type
  dbTransaction.userGradidoID = transaction.sender.gradidoID
  dbTransaction.userCommunityUuid = transaction.sender.communityUuid!
  return dbTransaction.save()
}
