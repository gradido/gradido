import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class GetChildEd25519Args {
  @Field(() => String)
  key: string

  @Field(() => String)
  chainCode: string

  @Field(() => Number)
  index: number
}
