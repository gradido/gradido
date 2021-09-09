/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'
import { User } from '../models/User'
import encode from '../../jwt/encode'

@ObjectType()
export class LoginResponse {
  constructor(json: any) {
    this.token = encode(json.sessionId)
    this.user = new User(json.user)
  }

  @Field(() => String)
  token: string

  @Field(() => User)
  user: User
}
