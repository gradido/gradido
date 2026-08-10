// AI-GENERATED — not an architecture reference
// A free text the member writes about themselves. It belongs to the person, not to any
// one entry, so it sits on `users` and is sent along with every matching entry the
// member publishes — someone reading an offer sees who is behind it.
//
// Nullable with no default: nobody has written one yet, and an empty string would claim
// they had.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `about_me` text NULL DEFAULT NULL AFTER `gms_publish_location`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP COLUMN `about_me`;')
}
