import { Entity, BaseEntity } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class UpdateUserInfosResponse extends BaseEntity {
  @Field(() => String)
  state: string

  @Field(() => Number)
  validValues: number

  @Field(() => [String])
  errors: [string]
}
