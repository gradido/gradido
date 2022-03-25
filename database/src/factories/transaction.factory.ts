import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { Transaction } from '../../entity/Transaction'
import { TransactionContext } from '../interface/TransactionContext'
import Decimal from 'decimal.js-light'

define(Transaction, (faker: typeof Faker, context?: TransactionContext) => {
  if (!context) {
    throw new Error('TransactionContext not well defined.')
  }

  const transaction = new Transaction()
  transaction.typeId = context.typeId // || 2
  transaction.userId = context.userId
  transaction.amount = context.amount
  transaction.balance = context.balance
  transaction.decay = new Decimal(0) // context.decay
  transaction.memo = context.memo
  transaction.creationDate = context.creationDate || new Date()
  // transaction.sendReceiverPublicKey = context.sendReceiverPublicKey || null
  transaction.linkedUserId = context.sendReceiverUserId || null

  return transaction
})
