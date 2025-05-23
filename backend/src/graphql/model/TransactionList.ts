import { Field, ObjectType } from 'type-graphql'

import { Balance } from './Balance'
import { Transaction } from './Transaction'

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
