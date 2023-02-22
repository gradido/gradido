// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class GetTestApiResult {
  constructor(apiVersion: string) {
    this.api = apiVersion
  }

  @Field(() => String)
  api: string
}
