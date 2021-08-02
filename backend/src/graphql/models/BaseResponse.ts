import { Entity, BaseEntity } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class BaseResponse extends BaseEntity {
  @Field(() => Boolean)
  success: boolean
}
