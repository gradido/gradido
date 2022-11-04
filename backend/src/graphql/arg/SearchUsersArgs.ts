import { ArgsType, Field, Int } from 'type-graphql'
import SearchUsersFilters from '@arg/SearchUsersFilters'

@ArgsType()
export default class SearchUsersArgs {
  @Field(() => String)
  searchText: string

  @Field(() => Int, { nullable: true })
  currentPage?: number

  @Field(() => Int, { nullable: true })
  pageSize?: number

  @Field(() => SearchUsersFilters, { nullable: true, defaultValue: null })
  filters: SearchUsersFilters
}
