// AI-GENERATED — not an architecture reference

import { Location } from '@model/Location'
import { UserLocationResult } from '@model/UserLocationResult'
import { printSchema } from 'graphql'
import { buildSchema, Query, Resolver } from 'type-graphql'

import { LocationScalar } from '@/graphql/scalar/Location'

/**
 * The shape of the answer, measured at the schema rather than argued from the decorator.
 *
 * `userLocation` has to be nullable, and nothing else in this repository says so: the
 * resolver returns null for an account without a position since 09.09.2026, and a
 * non-null field would turn that member's perfectly ordinary state into a GraphQL error
 * -- the whole query failing, for exactly the people this was fixed for. The wallet's own
 * specs cannot see it, because they hand the page an answer of their own making.
 *
 * `communityLocation` beside it has to stay non-null: it belongs to the instance, not to
 * the member, three components read it as always-there, and the resolver refuses to
 * answer at all when it is missing.
 *
 * Location is a SCALAR here (registered in graphql/schema.ts), not an object type -- which
 * is why the wallet asks for these two fields without a sub-selection and why an empty
 * Location used to serialize as a plain `{}`.
 */
@Resolver()
class ProbeResolver {
  @Query(() => UserLocationResult)
  userLocation(): UserLocationResult {
    return new UserLocationResult()
  }
}

describe('UserLocationResult', () => {
  it('says a member may have no position, and an instance may not', async () => {
    const schema = await buildSchema({
      resolvers: [ProbeResolver],
      scalarsMap: [{ type: Location, scalar: LocationScalar }],
    })

    expect(printSchema(schema)).toContain(
      [
        'type UserLocationResult {',
        '  userLocation: Location',
        '  communityLocation: Location!',
        '}',
      ].join('\n'),
    )
  })
})
