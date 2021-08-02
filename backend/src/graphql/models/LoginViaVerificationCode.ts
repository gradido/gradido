/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Entity, BaseEntity, Column } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class LoginViaVerificationCode extends BaseEntity {
  constructor(json: any) {
    super()
    this.sessionId = json.session_id
    this.email = json.user.email
  }

  @Field(() => Number)
  @Column()
  sessionId: number

  @Field(() => String)
  @Column()
  email: string
}
