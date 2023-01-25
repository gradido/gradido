import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class GetTestApiResult {
  constructor(apiVersion: string) {
    this.api = `${apiVersion}`
  }

  @Field(() => String)
  api: string
}
