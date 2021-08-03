/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class Decay {
  constructor(json: any) {
    this.balance = Number(json.balance)
    this.decayStart = json.decay_start
    this.decayEnd = json.decay_end
    this.decayDuration = json.decay_duration
  }

  @Field(() => Number)
  balance: number

  @Field({ nullable: true })
  decayStart?: number

  @Field({ nullable: true })
  decayEnd?: number

  @Field(() => String)
  decayDuration: string
}
