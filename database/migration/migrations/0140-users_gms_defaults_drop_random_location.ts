// AI-GENERATED — not an architecture reference
// GMS: the location type RANDOM (2) goes away, and a member is no longer in GMS by default.
//
// - `gms_publish_location` defaults to 1 (APPROXIMATE) instead of 2 (RANDOM); every member
//   still on RANDOM moves to APPROXIMATE.
// - `gms_allowed` defaults to 0 instead of 1.
// - A member without a location cannot be placed on the map, so their `gms_allowed` is set
//   to 0.
//
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `gms_publish_location` int unsigned NOT NULL DEFAULT 1;',
  )
  await queryFn('ALTER TABLE `users` MODIFY COLUMN `gms_allowed` tinyint(1) NOT NULL DEFAULT 0;')
  await queryFn('UPDATE `users` SET `gms_publish_location` = 1 WHERE `gms_publish_location` = 2;')
  await queryFn('UPDATE `users` SET `gms_allowed` = 0 WHERE `location` IS NULL;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Only the defaults are restored. Which members were on RANDOM, and which members without
  // a location had `gms_allowed` set, is not kept anywhere.
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `gms_publish_location` int unsigned NOT NULL DEFAULT 2;',
  )
  await queryFn('ALTER TABLE `users` MODIFY COLUMN `gms_allowed` tinyint(1) NOT NULL DEFAULT 1;')
}
