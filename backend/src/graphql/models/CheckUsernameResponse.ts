/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Entity, BaseEntity } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class CheckUsernameResponse extends BaseEntity {
  constructor(json: any) {
    super()
    this.state = json.state
    this.msg = json.msg
    this.groupId = json.group_id
  }

  @Field(() => String)
  state: string

  @Field(() => String)
  msg?: string

  @Field(() => Number)
  groupId?: number
}
