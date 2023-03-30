import { ObjectType, Field } from 'type-graphql'

import { Transaction } from './Transaction'
import { Balance } from './Balance'

@ObjectType()
export class TransactionList {
  constructor(balance: Balance, transactions: Transaction[]) {
    this.balance = balance
    this.transactions = transactions
  }

  @Field(() => Balance)
  balance: Balance

  @Field(() => [Transaction])
  transactions: Transaction[]
}
