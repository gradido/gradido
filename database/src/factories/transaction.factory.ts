import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { Transaction } from '../../entity/Transaction'
import { TransactionContext } from '../interface/TransactionContext'
import { randomBytes } from 'crypto'

define(Transaction, (faker: typeof Faker, context?: TransactionContext) => {
  if (!context) context = {}

  const transaction = new Transaction()
  transaction.transactionTypeId = context.transactionTypeId ? context.transactionTypeId : 2
  transaction.txHash = context.txHash ? context.txHash : randomBytes(48)
  transaction.memo = context.memo ? context.memo : faker.lorem.sentence()
  transaction.received = context.received ? context.received : new Date()
  transaction.blockchainTypeId = context.blockchainTypeId ? context.blockchainTypeId : 1
  if (context.transactionSendCoin) transaction.transactionSendCoin = context.transactionSendCoin
  if (context.transactionCreation) transaction.transactionCreation = context.transactionCreation

  return transaction
})
