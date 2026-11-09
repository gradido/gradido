// AI-GENERATED — not an architecture reference
import { Query, Resolver } from 'type-graphql'

// GraphQL takes no schema without a field on Query, and every query of this api has moved to
// the peer api (core crossCommunity/apiRoutes). Goes with the mutations that are still here.
@Resolver()
export class AliveResolver {
  @Query(() => Boolean)
  alive(): boolean {
    return true
  }
}
