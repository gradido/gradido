// AI-GENERATED — not an architecture reference
import { MatchingGeoProvider, MatchingMapEngine } from '@enum/MatchingMapSwitches'
import { Field, ObjectType } from 'type-graphql'

/**
 * The two build-phase switches of the matching map for this community server (K-008):
 * which map the wallet draws and which place search it asks, forward and reverse
 * together. An admin sets them in the admin panel and the wallet asks for them, so
 * switching needs no deploy.
 *
 * Not a secret: every logged-in member may read them, the wallet cannot draw a map
 * without knowing which one.
 */
@ObjectType()
export class MatchingMapSwitches {
  @Field(() => MatchingMapEngine)
  mapEngine: MatchingMapEngine

  @Field(() => MatchingGeoProvider)
  geoProvider: MatchingGeoProvider
}
