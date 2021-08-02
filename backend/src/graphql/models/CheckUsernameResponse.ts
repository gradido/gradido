import { Entity, BaseEntity } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class CheckUsernameResponse extends BaseEntity {
  @Field(() => String)
  state: string

  @Field(() => String)
  msg?: string

  @Field(() => Number)
  groupId?: number
}
