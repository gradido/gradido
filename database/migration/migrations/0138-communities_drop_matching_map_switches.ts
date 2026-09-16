// AI-GENERATED — not an architecture reference
// Drops the two build-phase switches of the matching map again (K-008, added by 0133).
//
// They were a building aid for the time both maps and both place searches lived side by
// side. The wallet now draws with MapLibre and asks Gradido's own search alone, and the
// backend and the admin panel no longer offer the switches, so nothing reads either column.
// Whatever an admin last stored goes with them: there is no second position left.
//
// ⛔ 0133 stays in place. It has run on the test servers, and the migration runner loads
// every migration a database has recorded by its file name - a server that ran 0133 would
// fail to migrate without the file (MODULE_NOT_FOUND) and stay on the waiting page.
//
// `IF EXISTS`, one statement per column, for the reason 0133 gives: DDL does not roll back,
// and start.sh has already stopped the services when this runs. A retry after a connection
// dropped halfway must not die on a column that is already gone.
//
// The downgrade adds both back the way 0133 created them - same type, NOT NULL, the old pair
// as the default. The positions an admin had stored do not come back.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `communities` DROP COLUMN IF EXISTS `matching_geo_provider`;')
  await queryFn('ALTER TABLE `communities` DROP COLUMN IF EXISTS `matching_map_engine`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    "ALTER TABLE `communities` ADD COLUMN IF NOT EXISTS `matching_map_engine` VARCHAR(16) NOT NULL DEFAULT 'leaflet';",
  )
  await queryFn(
    "ALTER TABLE `communities` ADD COLUMN IF NOT EXISTS `matching_geo_provider` VARCHAR(16) NOT NULL DEFAULT 'nominatim';",
  )
}
