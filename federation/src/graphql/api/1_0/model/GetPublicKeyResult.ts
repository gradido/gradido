// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class GetPublicKeyResult {
  constructor(pubKey: string) {
    this.publicKey = pubKey
  }

  @Field(() => String)
  publicKey: string
}
