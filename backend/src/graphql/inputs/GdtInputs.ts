import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export class GdtTransactionInput {
  @Field(() => String)
  email: string

  @Field(() => Int, { nullable: true })
  currentPage?: number

  @Field(() => Int, { nullable: true })
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
