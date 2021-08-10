import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class GdtTransactionInput {
  @Field(() => String)
  email: string

  @Field(() => Number)
  firstPage?: number

  @Field(() => Number)
  items?: number

  @Field(() => String)
  order?: string
}
