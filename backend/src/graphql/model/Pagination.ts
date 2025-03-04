import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class Pagination {
  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  pages: number

  constructor(total: number, page: number, pages: number) {
    this.total = total
    this.page = page
    this.pages = pages
  }
}
