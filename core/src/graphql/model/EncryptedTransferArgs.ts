import { Field, InputType } from 'type-graphql'

@InputType()
export class EncryptedTransferArgs {
  @Field(() => String)
  handshakeID: string

  @Field(() => String)
  publicKey: string

  @Field(() => String)
  jwt: string
}
