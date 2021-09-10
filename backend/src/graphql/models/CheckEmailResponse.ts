/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class CheckEmailResponse {
  constructor(json: any) {
    this.sessionId = json.session_id
    this.email = json.user.email
    this.language = json.user.language
    this.firstName = json.user.first_name
    this.lastName = json.user.last_name
  }

  @Field(() => Number)
  sessionId: number

  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => String)
  language: string
}
