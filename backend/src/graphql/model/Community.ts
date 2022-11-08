/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class Community {
  constructor(json?: any) {
    if (json) {
      this.id = Number(json.id)
      this.name = json.name
      this.url = json.url
      this.description = json.description
      this.registerUrl = json.registerUrl
    }
  }

  @Field(() => Number)
  id: number

  @Field(() => String)
  uuid: string

  @Field(() => String)
  name: string

  @Field(() => String)
  url: string

  @Field(() => String)
  description: string

  @Field(() => String)
  registerUrl: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => String)
  apiVersion: string

  @Field(() => Date)
  validFrom: Date
}
