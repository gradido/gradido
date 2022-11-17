import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class OpenConnectOneTimeResult {
  constructor(encryptedUuid: string) {
    this.encryptedUuid = encryptedUuid
  }

  @Field(() => String)
  encryptedUuid: string
}
