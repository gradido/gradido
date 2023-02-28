import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class GetPublicKeyResult {
  constructor(pubKey: string) {
    this.publicKey = pubKey
  }

  @Field(() => String)
  publicKey: string
}
