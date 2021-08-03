/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'
import { User } from './User'

// temporaray solution until we have JWT implemented

@ObjectType()
export class LoginResponse {
  constructor(json: any) {
    this.sessionId = json.session_id
    this.user = new User(json.user)
  }

  @Field(() => Number)
  sessionId: number

  @Field(() => User)
  user: User
}
