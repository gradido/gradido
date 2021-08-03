import { Entity, BaseEntity, Column } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class TransactionList extends BaseEntity {
  constructor(json: any) {
    super()
    this.gdtSum = Number(json.gdtSum)
    this.count = json.count
    this.balance = Number(json.balance)
    this.decay = Number(json.decay)
    this.decayDate = json.decay_date
    this.transactions = json.transactions
  }

  @Field(() => Number)
  @Column()
  gdtSum: number

  @Field(() => Number)
  @Column()
  count: number

  @Field(() => Number)
  @Column()
  balance: number

  @Field(() => Number)
  @Column()
  decay: number

  @Field(() => String)
  @Column()
  decayDate: string

  @Field(() => [Transaction])
  transactions: Transaction[]
}

@Entity()
@ObjectType()
export class Transaction extends BaseEntity {
  constructor(json: any) {
    super()
    this.type = json.type
    this.balance = Number(json.balance)
    this.decayStart = json.decay_start
    this.decayEnd = json.decay_end
    this.decayDuration = json.decay_duration
    this.meno = json.memo
    this.transactionId = json.transaction_id
    this.name = json.name
    this.email = json.email
    this.date = json.date
    this.decay = json.decay
  }

  @Field(() => String)
  @Column()
  type: string  

  @Field(() => Number)
  @Column()
  balance: number

  @Field(() => Number)
  @Column()
  decayStart: number

  @Field(() => Number)
  @Column()
  decayEnd: number

  @Field(() => String)
  @Column()
  decayDuration: string

  @Field(() => String)
  @Column()
  memo: string

  @Field(() => Number)
  @Column()
  transactionId: number

  @Field(() => String)
  @Column()
  name: string

  @Field(() => String)
  @Column()
  email: string

  @Field(() => String)
  @Column()
  date: string

  @Field(() => Decay)
  @Column()
  decay: Decay
}
