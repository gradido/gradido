/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Entity, BaseEntity } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class ResetPasswordResponse extends BaseEntity {
  constructor(json: any) {
    super()
    this.state = json.state
  }

  @Field(() => String)
  state: string
}
