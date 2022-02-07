/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'
import { Transaction } from './Transaction'

@ObjectType()
export class TransactionList {
  constructor() {
    this.gdtSum = 0
    this.count = 0
    this.balance = 0
    this.decay = 0
    this.decayDate = ''
  }

  @Field(() => Number)
  gdtSum: number

  @Field(() => Number)
  count: number

  @Field(() => Number)
  balance: number

  @Field(() => Number)
  decay: number

  @Field(() => String)
  decayDate: string

  @Field(() => [Transaction])
  transactions: Transaction[]
}
