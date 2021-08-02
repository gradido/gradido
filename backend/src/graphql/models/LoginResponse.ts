/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Entity, BaseEntity, Column } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'
import { User } from './User'

// temporaray solution until we have JWT implemented

@Entity()
@ObjectType()
export class LoginResponse extends BaseEntity {
  constructor(json: any) {
    super()
    this.sessionId = json.session_id
    this.user = new User(json.user)
  }

  @Field(() => Number)
  @Column()
  sessionId: number

  @Field(() => User)
  @Column()
  user: User
}
