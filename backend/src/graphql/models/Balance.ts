import { Entity, BaseEntity, Column } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class Balance extends BaseEntity {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(json: any) {
    super()
    this.balance = json.balance
    this.decay = json.decay
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
