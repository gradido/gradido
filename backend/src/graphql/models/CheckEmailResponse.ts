/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class CheckEmailResponse {
  constructor(json: any) {
    this.sessionId = json.session_id
    this.email = json.user.email
    this.language = json.user.language
  }

  @Field(() => Number)
  sessionId: number

  @Field(() => String)
  email: string

  @Field(() => String)
  language: string
}
