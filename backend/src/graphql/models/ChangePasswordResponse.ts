import { Entity, BaseEntity } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class ChangePasswordResponse extends BaseEntity {
  @Field(() => String)
  state: string
}
