/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Entity, BaseEntity, Column } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class Balance extends BaseEntity {
  constructor(json: any) {
    super()
    this.balance = Number(json.balance)
    this.decay = Number(json.decay)
    this.decayDate = json.decay_date
  }

  @Field(() => Number)
  @Column()
  balance: number

  @Field(() => Number)
  @Column()
  decay: number

  @Field(() => String)
  @Column()
  decayDate: string
}
