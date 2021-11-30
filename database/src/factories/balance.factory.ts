import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { Balance } from '../../entity/Balance'
import { BalanceContext } from '../interface/TransactionContext'

define(Balance, (faker: typeof Faker, context?: BalanceContext) => {
  if (!context || !context.user) {
    throw new Error('Balance: No user present!')
  }

  const balance = new Balance()
  balance.modified = context.modified ? context.modified : faker.date.recent()
  balance.recordDate = context.recordDate ? context.recordDate : faker.date.recent()
  balance.amount = context.amount ? context.amount : 10000000
  balance.user = context.user

  return balance
})
