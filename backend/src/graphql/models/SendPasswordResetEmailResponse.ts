/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class SendPasswordResetEmailResponse {
  constructor(json: any) {
    this.state = json.state
    this.msg = json.msg
  }

  @Field(() => String)
  state: string

  @Field(() => String)
  msg?: string
}
