import { ArgsType, Field, Int } from 'type-graphql'

import { SearchUsersFilters } from '@arg/SearchUsersFilters'

@ArgsType()
export class SearchUsersArgs {
  @Field(() => String)
  searchText: string

  @Field(() => Int, { nullable: true })
  // eslint-disable-next-line type-graphql/invalid-nullable-input-type
  currentPage?: number

  @Field(() => Int, { nullable: true })
  // eslint-disable-next-line type-graphql/invalid-nullable-input-type
  pageSize?: number

  // eslint-disable-next-line type-graphql/wrong-decorator-signature
  @Field(() => SearchUsersFilters, { nullable: true, defaultValue: null })
  filters?: SearchUsersFilters | null
}
