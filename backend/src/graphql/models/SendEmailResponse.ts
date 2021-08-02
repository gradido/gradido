import { Entity, BaseEntity } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class SendEmailResponse extends BaseEntity {
  constructor(json: any) {
    super()
    this.state = json.state
    this.msg = json.msg
  }

  @Field(() => String)
  state: string

  @Field(() => String)
  msg?: string
}
