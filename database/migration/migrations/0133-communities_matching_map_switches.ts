// AI-GENERATED — not an architecture reference
// Two switches for the build phase of the matching map, one row per community server:
// which map the wallet draws (Leaflet or MapLibre) and which place search it asks
// (Nominatim or Gradido's own search on the GMS, forward and reverse together).
//
// ⭐ The defaults are the OLD pair, and that is the sentence every existing community
// needs: after this migration the wallet behaves exactly as before, on every server,
// until an admin switches in the admin panel. No deploy is needed to switch, and none
// is needed to switch back.
//
// Switching by hand is one statement:
//   UPDATE communities SET matching_geo_provider = 'gms' WHERE foreign = 0;
//
// Temporary on purpose: once the new map and search are accepted everywhere, a later
// migration drops both columns again.
//
// `IF NOT EXISTS`, one statement per column, same reason as 0126 and 0127: DDL does not
// roll back, and start.sh has already stopped the services when this runs.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    "ALTER TABLE `communities` ADD COLUMN IF NOT EXISTS `matching_map_engine` VARCHAR(16) NOT NULL DEFAULT 'leaflet';",
  )
  await queryFn(
    "ALTER TABLE `communities` ADD COLUMN IF NOT EXISTS `matching_geo_provider` VARCHAR(16) NOT NULL DEFAULT 'nominatim';",
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `communities` DROP COLUMN IF EXISTS `matching_geo_provider`;')
  await queryFn('ALTER TABLE `communities` DROP COLUMN IF EXISTS `matching_map_engine`;')
}
