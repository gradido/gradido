import { Query, Resolver } from 'type-graphql'

@Resolver()
export class TestResolver {
  @Query(() => Boolean)
  async test(): Promise<boolean> {
    return true
  }
}
