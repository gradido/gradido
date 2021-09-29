/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field, Int } from 'type-graphql'
import { Transaction } from '../../typeorm/entity/Transaction'

@ObjectType()
export class Decay {
  constructor(json: any) {
    if (json) {
      this.balance = Number(json.balance)
      this.decayStart = json.decay_start
      this.decayEnd = json.decay_end
      this.decayDuration = json.decay_duration
      this.decayStartBlock = json.decay_start_block
    }
  }

  static async getDecayStartBlock(): Promise<Transaction | undefined> {
    if (!this.decayStartBlockTransaction) {
      this.decayStartBlockTransaction = await Transaction.getDecayStartBlock()
    }
    return this.decayStartBlockTransaction
  }

  @Field(() => Number)
  balance: number

  // timestamp in seconds
  @Field(() => Int, { nullable: true })
  decayStart: string

  // timestamp in seconds
  @Field(() => Int, { nullable: true })
  decayEnd: string

  @Field(() => String, { nullable: true })
  decayDuration?: number

  @Field(() => Int, { nullable: true })
  decayStartBlock?: string

  static decayStartBlockTransaction: Transaction | undefined
}
