/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class Balance {
  constructor(json: any) {
    this.balance = Number(json.balance)
    this.decay = Number(json.decay)
    this.decayDate = json.decay_date
  }

  @Field(() => Number)
  balance: number

  @Field(() => Number)
  decay: number

  @Field(() => String)
  decayDate: string
}
