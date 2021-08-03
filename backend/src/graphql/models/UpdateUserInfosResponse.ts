/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Entity, BaseEntity } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class UpdateUserInfosResponse extends BaseEntity {
  constructor(json: any) {
    super()
    this.validValues = json.valid_values
  }

  @Field(() => Number)
  validValues: number
}
