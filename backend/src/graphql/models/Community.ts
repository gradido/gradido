/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class Community {
  constructor(json?: any) {
    if (json) {
      this.id = json.id
      this.name = json.name
      this.description = json.description
      this.location = json.location
      this.url = json.url
      this.registerUrl = json.registerUrl
    }
  }

  @Field(() => Number)
  id: number

  @Field(() => String)
  name: string

  @Field(() => String)
  description: string

  @Field(() => String)
  location: string

  @Field(() => String)
  url: string

  @Field(() => String)
  registerUrl: string
}
