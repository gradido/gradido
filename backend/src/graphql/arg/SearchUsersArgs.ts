import { Args, ArgsType, Field, Int } from 'type-graphql'
import SearchUsersFilters from '@arg/SearchUsersFilters'

@ArgsType()
export default class SearchUsersArgs {
  @Field(() => String)
  searchText: string

  @Field(() => Int, { nullable: true })
  currentPage?: number

  @Field(() => Int, { nullable: true })
  pageSize?: number

  // Wolle: @Field(() => Boolean, { nullable: true })
  // filterByActivated?: boolean | null

  // Wolle: @Field(() => Boolean, { nullable: true })
  // filterByDeleted?: boolean | null

  // Wolle: shall this be nullable?
  @Field()
  filters: SearchUsersFilters
}
