import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export default class SearchUsersArgs {
  @Field(() => String)
  searchText: string

  @Field(() => Int, { nullable: true })
  currentPage?: number

  @Field(() => Int, { nullable: true })
  pageSize?: number

  @Field(() => Boolean, { nullable: true })
  emailChecked?: boolean | null

  @Field(() => Boolean, { nullable: true })
  isDeleted?: boolean | null
}
