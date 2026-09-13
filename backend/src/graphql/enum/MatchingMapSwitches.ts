// AI-GENERATED — not an architecture reference
import { MatchingGeoProvider, MatchingMapEngine } from 'database'
import { registerEnumType } from 'type-graphql'

export { MatchingGeoProvider, MatchingMapEngine }

// The GraphQL enums are the boundary check for the two switches: a value that is not a
// switch position is refused before any resolver runs.
registerEnumType(MatchingMapEngine, {
  name: 'MatchingMapEngine',
  description: 'Which map the wallet draws for the matching (build phase)',
})

registerEnumType(MatchingGeoProvider, {
  name: 'MatchingGeoProvider',
  description: 'Which place search the wallet asks, forward and reverse (build phase)',
})
