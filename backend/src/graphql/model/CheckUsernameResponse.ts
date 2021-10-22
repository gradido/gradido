/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class CheckUsernameResponse {
  constructor(json: any) {
    this.state = json.state
  }

  @Field(() => String)
  state: string
}
