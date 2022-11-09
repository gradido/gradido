/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class Community {
  constructor(name: string, url: string, descript: string) {
    this.name = name
    this.url = url
    this.description = descript
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

  @Field(() => Date)
  createdAt: Date

  @Field(() => Buffer)
  publicKey: Buffer

  @Field(() => Buffer)
  privKey: Buffer

  @Field(() => String)
  apiVersion: string

  @Field(() => Date)
  validFrom: Date
}
