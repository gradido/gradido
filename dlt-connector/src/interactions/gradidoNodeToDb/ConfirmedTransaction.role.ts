import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { Transaction } from '@entity/Transaction'

export class ConfirmedTransactionRole {
  // eslint-disable-next-line no-useless-constructor
  public constructor(private self: Transaction) {}

  public fillFromConfirmedTransaction(confirmedTransactionProto: ConfirmedTransaction) {
    const confirmedTransaction = ConfirmedTransactionEntity.create()
    confirmedTransaction.transactionRecipe = transactionRecipe.getTransactionRecipeEntity()
    confirmedTransaction.nr = confirmedTransactionProto.id.toInt()
    confirmedTransaction.runningHash = Buffer.from(confirmedTransactionProto.runningHash)
    const balanceAccount = transactionRecipe.getBalanceAccount()
    if (balanceAccount === undefined) {
      throw new LogError('something went wrong with balance account')
    }
    if (balanceAccount) {
      confirmedTransaction.account = balanceAccount
    }
    confirmedTransaction.accountBalance = new Decimal(confirmedTransactionProto.accountBalance)
    confirmedTransaction.confirmedAt = timestampSecondsToDate(confirmedTransactionProto.confirmedAt)
    return confirmedTransaction
  }
}
