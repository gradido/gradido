// AI-GENERATED — not an architecture reference

/**
 * Which map the wallet draws for the matching (plan decision K-008). A build-phase
 * switch per community server, set in the admin panel; the values are what the column
 * `communities.matching_map_engine` stores.
 *
 * TODO: replace with a valibot schema after update to typescript 5 is possible
 */
export enum MatchingMapEngine {
  LEAFLET = 'leaflet',
  MAPLIBRE = 'maplibre',
}

/**
 * Which place search the wallet asks, forward and reverse together (K-008): Nominatim
 * on openstreetmap.org, or Gradido's own search on the GMS. Stored in
 * `communities.matching_geo_provider`.
 *
 * TODO: replace with a valibot schema after update to typescript 5 is possible
 */
export enum MatchingGeoProvider {
  NOMINATIM = 'nominatim',
  GMS = 'gms',
}
