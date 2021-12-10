import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { UserTransaction } from '../../entity/UserTransaction'
import { UserTransactionContext } from '../interface/TransactionContext'

define(UserTransaction, (faker: typeof Faker, context?: UserTransactionContext) => {
  if (!context || !context.userId || !context.transactionId) {
    throw new Error('UserTransaction: No userId and/or transactionId present!')
  }

  const userTransaction = new UserTransaction()
  userTransaction.userId = context.userId
  userTransaction.transactionId = context.transactionId
  userTransaction.transactionTypeId = context.transactionTypeId ? context.transactionTypeId : 1
  userTransaction.balance = context.balance ? context.balance : 100000
  userTransaction.balanceDate = context.balanceDate ? context.balanceDate : new Date()

  return userTransaction
})
