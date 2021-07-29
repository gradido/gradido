import { Entity, BaseEntity, Column } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class Transaction extends BaseEntity {
  @Field(() => String)
  @Column({ length: 191 })
  email: string
}
