import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class GdtTransactionInput {
  @Field(() => String)
  email: string

  @Field(() => Number, { nullable: true })
  currentPage?: number

  @Field(() => Number, { nullable: true })
  pageSize?: number

  @Field(() => String, { nullable: true })
  order?: string
}
@ArgsType()
export class GdtTransactionSessionIdInput {
  @Field(() => Number)
  sessionId: number

  @Field(() => Number, { nullable: true })
  currentPage?: number

  @Field(() => Number, { nullable: true })
  pageSize?: number

  @Field(() => String, { nullable: true })
  order?: string
}
