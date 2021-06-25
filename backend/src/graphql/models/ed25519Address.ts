import { ObjectType, Field } from 'type-graphql'
@ObjectType()
export class ed25519Address {
  @Field()
  rootPublicKey: string

  @Field({ nullable: true })
  rootPrivateKey?: string

  @Field()
  chainCode: string

  @Field()
  publicKey: string

  @Field({ nullable: true })
  privateKey?: string

  @Field()
  index: number
}
