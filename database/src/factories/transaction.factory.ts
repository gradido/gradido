import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { Transaction } from '../../entity/Transaction'
import { TransactionContext } from '../interface/TransactionContext'
import { randomBytes } from 'crypto'

define(Transaction, (faker: typeof Faker, context?: TransactionContext) => {
  if (!context) {
    throw new Error('TransactionContext not well defined.')
  }

  const transaction = new Transaction()
  transaction.transactionTypeId = context.transactionTypeId // || 2
  transaction.userId = context.userId
  transaction.amount = context.amount
  transaction.txHash = context.txHash || randomBytes(48)
  transaction.memo = context.memo
  transaction.received = context.received || new Date()
  transaction.signature = context.signature || randomBytes(64)
  transaction.pubkey = context.pubkey || randomBytes(32)
  transaction.creationIdentHash = context.creationIdentHash || randomBytes(32)
  transaction.creationDate = context.creationDate || new Date()
  // transaction.sendReceiverPublicKey = context.sendReceiverPublicKey || null
  transaction.linkedUserId = context.sendReceiverUserId || null
  transaction.sendSenderFinalBalance = context.sendSenderFinalBalance || null

  return transaction
})
