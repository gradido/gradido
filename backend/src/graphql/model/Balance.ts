/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'
import Decimal from '../../util/decimal'

@ObjectType()
export class Balance {
  constructor(json: any) {
    this.balance = json.balance
    this.decay = json.decay
    this.decayDate = json.decay_date
  }

  @Field(() => Decimal)
  balance: Decimal

  @Field(() => Decimal)
  decay: Decimal

  @Field(() => String)
  decayDate: string
}
