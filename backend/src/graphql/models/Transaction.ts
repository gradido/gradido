/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'
import { Decay } from './Decay'

// we need a better solution for the decay block:
// the first transaction on the first page shows the decay since the last transaction
// the format is actually a Decay and not a Transaction.
// Therefore we have a lot of nullable fields, which should be always present

@ObjectType()
export class Transaction {
  constructor()
  constructor(json: any)
  constructor(json?: any) {
    if(json) {
      this.type = json.type
      this.balance = Number(json.balance)
      this.decayStart = json.decay_start
      this.decayEnd = json.decay_end
      this.decayDuration = json.decay_duration
      this.memo = json.memo
      this.transactionId = json.transaction_id
      this.name = json.name
      this.email = json.email
      this.date = json.date
      this.decay = json.decay ? new Decay(json.decay) : undefined
    } 
  }

  @Field(() => String)
  type: string

  @Field(() => Number)
  balance: number

  @Field(() => Number)
  totalBalance: number

  @Field({ nullable: true })
  decayStart?: number

  @Field({ nullable: true })
  decayEnd?: number

  @Field({ nullable: true })
  decayDuration?: string

  @Field(() => String)
  memo: string

  @Field(() => Number, { nullable: true })
  transactionId?: number

  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  email?: string

  @Field({ nullable: true })
  date?: string

  @Field({ nullable: true })
  decay?: Decay
}

@ObjectType()
export class TransactionList {
  constructor(json: any) {
    this.gdtSum = Number(json.gdtSum)
    this.count = json.count
    this.balance = Number(json.balance)
    this.decay = Number(json.decay)
    this.decayDate = json.decay_date
    this.transactions = json.transactions.map((el: any) => {
      return new Transaction(el)
    })
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
