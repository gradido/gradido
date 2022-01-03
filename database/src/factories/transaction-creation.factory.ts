import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { TransactionCreation } from '../../entity/TransactionCreation'
import { TransactionCreationContext } from '../interface/TransactionContext'

define(TransactionCreation, (faker: typeof Faker, context?: TransactionCreationContext) => {
  if (!context || !context.userId || !context.transaction) {
    throw new Error('TransactionCreation: No userId and/or transaction present!')
  }

  const transactionCreation = new TransactionCreation()
  transactionCreation.userId = context.userId
  transactionCreation.amount = context.amount ? context.amount : 100000
  transactionCreation.targetDate = context.targetDate ? context.targetDate : new Date()
  transactionCreation.transaction = context.transaction

  return transactionCreation
})
