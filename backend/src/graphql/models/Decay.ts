import { Entity, BaseEntity, Column } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class Decay extends BaseEntity {
  constructor(json: any) {
    super()
    this.balance = Number(json.balance)
    this.decayStart = json.decay_start
    this.decayEnd = json.decay_end
    this.decayDuration = json.decay_duration
  }

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
}
